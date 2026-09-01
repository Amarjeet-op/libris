"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLibrary, useBookState } from "@/context/LibraryContext";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { useSpeech } from "@/hooks/useSpeech";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useIdleVisibility } from "@/hooks/useIdleVisibility";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { buildSpeechChunks } from "@/lib/textChunk";
import { getDemoBook } from "@/lib/demoBook";
import { getVoiceSettings, setVoiceSettings as persistVoiceSettings, getBookState } from "@/lib/storage";
import { generateId } from "@/lib/id";
import { isPdfFile, isAudioFile, resolveAudioMimeType } from "@/lib/fileType";
import { ReaderTopBar } from "./ReaderTopBar";
import { BookSpread } from "./BookSpread";
import { ReadingControls } from "./ReadingControls";
import { ReadingSidebar } from "./ReadingSidebar";
import { LoadingBook } from "@/components/shared/LoadingBook";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg,.webm,audio/*";

export function Reader({ bookId, title, author, isDemo, pdfFile, audioFile }) {
  const router = useRouter();
  const { addBook, attachAudioToBook } = useLibrary();
  const [bookState, updateBookState] = useBookState(bookId);
  const containerRef = useRef(null);
  const audioTimeRef = useRef(0);
  const initialAudioTimeRef = useRef(bookState.audioTime || 0);
  const audioReplaceInputRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const demo = useMemo(() => (isDemo ? getDemoBook() : null), [isDemo]);
  const pdfHook = usePdfDocument(isDemo ? null : pdfFile || null);

  const pageCount = isDemo ? demo.pageCount : pdfHook.pageCount;
  const pageTexts = isDemo ? demo.pageTexts : pdfHook.pageTexts;
  const status = isDemo ? "ready" : pdfHook.status;
  const scanned = isDemo ? false : pdfHook.scanned;

  const [localAudioFile, setLocalAudioFile] = useState(audioFile || null);
  const [audioPersistWarning, setAudioPersistWarning] = useState(false);
  useEffect(() => {
    if (audioFile) setLocalAudioFile(audioFile);
  }, [audioFile]);
  // Keep initialAudioTime in sync when persisted state hydrates after mount
  useEffect(() => {
    if (bookState.audioTime) initialAudioTimeRef.current = bookState.audioTime;
  }, [bookState.audioTime]);
  const hasAudioFile = Boolean(localAudioFile);

  // ---- pagination ----
  // The flipbook (react-pageflip) owns the live flip animation and reports
  // its current page back via onFlip; `currentPage` here is the source of
  // truth for persistence/UI and the one-time initial position it opens to
  // (BookSpread reads it once, as `startPage`, when it first mounts).
  const [currentPage, setCurrentPage] = useState(1);
  const flipRef = useRef(null);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const hasPromptedRef = useRef(false);
  // Whether the saved page (if any) has been resolved onto `currentPage` yet.
  // BookSpread must not mount before this — react-pageflip only reads its
  // starting page once, at construction, so if the flipbook mounted while
  // currentPage was still the default 1 it would permanently open on page 1
  // and ignore any saved progress, no matter what currentPage became later.
  const [pageResolved, setPageResolved] = useState(false);
  // Read persisted progress directly, in its own effect, instead of reacting
  // to `bookState` (which hydrates in useBookState's own effect one render
  // later) — going through that extra hop meant currentPage was still 1 by
  // the time this ran, so BookSpread could mount and lock in page 1 first.
  useEffect(() => {
    if (hasPromptedRef.current) return;
    hasPromptedRef.current = true;
    const saved = getBookState(bookId);
    if (saved.currentPage > 1) {
      setCurrentPage(saved.currentPage);
      setShowContinuePrompt(true);
    }
    setPageResolved(true);
  }, [bookId]);

  useEffect(() => {
    if (pageCount && currentPage > pageCount) setCurrentPage(pageCount);
  }, [pageCount, currentPage]);

  const handleFlip = useCallback((e) => {
    setCurrentPage(e.data + 1);
  }, []);

  // ---- page layout: single page vs. two-page spread ----
  // Defaults to the old device-based behavior until the reader picks one
  // explicitly, then that choice sticks (persisted per book, like fontSize).
  const pageLayout = bookState.pageLayout || (isMobile ? "single" : "double");
  const setPageLayout = useCallback(
    (mode) => updateBookState({ pageLayout: mode }),
    [updateBookState]
  );
  const pagesPerView = pageLayout === "single" ? 1 : 2;

  const leadPage = Math.max(1, Math.min(currentPage, pageCount || currentPage));
  const lastVisible = pagesPerView === 1 ? leadPage : Math.min(leadPage + 1, pageCount || leadPage);
  const canPrev = leadPage > 1;
  const canNext = lastVisible < pageCount;

  // Jump to a page out of sequence (sidebar, bookmarks, resume prompt, TTS
  // auto-advance) — a single flip transition to the target, not a sequential
  // flip through every page in between.
  const goToPage = useCallback(
    (n) => {
      if (!pageCount) return;
      const clamped = Math.max(1, Math.min(n, pageCount));
      setCurrentPage(clamped);
      flipRef.current?.pageFlip?.()?.flip(clamped - 1);
    },
    [pageCount]
  );

  const nextPage = useCallback(() => {
    flipRef.current?.pageFlip?.()?.flipNext();
  }, []);

  const prevPage = useCallback(() => {
    flipRef.current?.pageFlip?.()?.flipPrev();
  }, []);

  // ---- persistence: progress + last opened ----
  useEffect(() => {
    if (!pageCount) return;
    updateBookState({
      currentPage: leadPage,
      progress: Math.round((leadPage / pageCount) * 100),
      lastOpenedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadPage, pageCount]);

  useEffect(() => {
    const t = setInterval(() => {
      updateBookState((prev) => ({
        secondsRead: (prev.secondsRead || 0) + 5,
        ...(hasAudioFile ? { audioTime: audioTimeRef.current } : {}),
      }));
    }, 5000);
    return () => {
      clearInterval(t);
      // Catch whatever position was reached between the last tick and
      // navigating away, so the audiobook resumes right where it stopped.
      if (hasAudioFile) updateBookState({ audioTime: audioTimeRef.current });
    };
  }, [updateBookState, hasAudioFile]);

  // ---- bookmarks & notes ----
  const bookmarks = bookState.bookmarks || [];
  const isBookmarked = bookmarks.includes(leadPage);

  const toggleBookmark = useCallback(() => {
    updateBookState((prev) => {
      const has = (prev.bookmarks || []).includes(leadPage);
      return {
        bookmarks: has
          ? prev.bookmarks.filter((p) => p !== leadPage)
          : [...(prev.bookmarks || []), leadPage],
      };
    });
  }, [leadPage, updateBookState]);

  const removeBookmark = useCallback(
    (page) => {
      updateBookState((prev) => ({ bookmarks: (prev.bookmarks || []).filter((p) => p !== page) }));
    },
    [updateBookState]
  );

  const notes = bookState.notes || {};
  const onNotesChange = useCallback(
    (page, text) => {
      updateBookState((prev) => ({ notes: { ...(prev.notes || {}), [page]: text } }));
    },
    [updateBookState]
  );

  // ---- text highlights ----
  // { [page]: [{ id, start, end } | { id, rect }] } — start/end are character
  // offsets in the same space as computeHighlightBoxes/computeWordBoxes
  // (lib/pdf.js) for a word-snapped highlight; rect (fractions of the page's
  // rendered width/height) is used instead for a manual freeform highlight,
  // drawn when a page has no recognizable text nearby to snap to.
  const highlights = bookState.highlights || {};
  const addHighlight = useCallback(
    (page, data) => {
      updateBookState((prev) => {
        const map = prev.highlights || {};
        return {
          highlights: {
            ...map,
            [page]: [...(map[page] || []), { id: generateId(), ...data }],
          },
        };
      });
    },
    [updateBookState]
  );
  const removeHighlight = useCallback(
    (page, id) => {
      updateBookState((prev) => {
        const map = prev.highlights || {};
        return { highlights: { ...map, [page]: (map[page] || []).filter((h) => h.id !== id) } };
      });
    },
    [updateBookState]
  );

  // ---- voice settings ----
  // Hydration-safe: match server fallback on first render, hydrate from localStorage after mount
  const [voiceSettings, setVoiceSettingsState] = useState({
    voiceName: null,
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  useEffect(() => {
    setVoiceSettingsState(getVoiceSettings());
  }, []);
  const updateVoiceSettings = useCallback((patch) => {
    setVoiceSettingsState((prev) => {
      const next = { ...prev, ...patch };
      persistVoiceSettings(next);
      return next;
    });
  }, []);

  // ---- narration ----
  const speechChunks = useMemo(() => buildSpeechChunks(pageTexts), [pageTexts]);

  const onChunkChange = useCallback(
    (chunk) => {
      if (chunk.page >= leadPage && chunk.page <= lastVisible) return;
      goToPage(chunk.page);
    },
    [leadPage, lastVisible, goToPage]
  );

  const speech = useSpeech({
    chunks: speechChunks,
    onChunkChange,
    rate: voiceSettings.rate,
    pitch: voiceSettings.pitch,
    volume: voiceSettings.volume,
    voiceName: voiceSettings.voiceName,
  });

  const activeChunk =
    speech.chunkIndex >= 0 && (speech.speechState === "speaking" || speech.speechState === "paused")
      ? speechChunks[speech.chunkIndex]
      : null;

  // ---- uploaded audiobook ----
  // StrictMode-safe: create/revoke object URLs in effects, not during render.
  // `useMemo` with `revokeObjectURL` is impure and double-invokes in dev,
  // revoking the just-created URL before `<audio>` can load it — large 500MB
  // blobs then fail with MEDIA_ERR_SRC_NOT_SUPPORTED.
  const [audioUrl, setAudioUrl] = useState(null);
  useEffect(() => {
    if (!localAudioFile) {
      setAudioUrl(null);
      return;
    }
    const mimeType = resolveAudioMimeType(localAudioFile);
    let blob = localAudioFile;
    if (mimeType !== localAudioFile.type) {
      try {
        blob = localAudioFile.slice(0, localAudioFile.size, mimeType);
      } catch {
        blob = localAudioFile;
      }
    }
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [localAudioFile]);
  const audioPlayer = useAudioPlayer(audioUrl);

  useEffect(() => {
    audioTimeRef.current = audioPlayer.currentTime;
  }, [audioPlayer.currentTime]);

  // Resume the audiobook at the same spot the page was left on, once per
  // loaded file — so page and audio come back together, not audio at 0:00.
  const restoredAudioRef = useRef(false);
  useEffect(() => {
    restoredAudioRef.current = false;
  }, [audioUrl]);
  useEffect(() => {
    if (!audioPlayer.ready || restoredAudioRef.current) return;
    restoredAudioRef.current = true;
    if (initialAudioTimeRef.current > 0) audioPlayer.seek(initialAudioTimeRef.current);
  }, [audioPlayer.ready, audioPlayer.seek]);

  // If this book already has an audiobook attached from a previous visit,
  // default to it — otherwise reopening a book always fell back to text
  // narration and the uploaded audio (plus its resumed position) never played.
  const [activeSource, setActiveSource] = useState(() => (hasAudioFile ? "audio" : "narrate"));
  // Keep in sync when a persisted 500MB file hydrates after mount (hasAudioFile
  // flips from false → true after IDB load). Don't override an explicit user choice
  // after the first sync.
  const hasSyncedAudioSourceRef = useRef(false);
  useEffect(() => {
    if (!hasSyncedAudioSourceRef.current && hasAudioFile) {
      hasSyncedAudioSourceRef.current = true;
      setActiveSource("audio");
    }
    if (!hasAudioFile) hasSyncedAudioSourceRef.current = false;
  }, [hasAudioFile]);

  const setSource = useCallback(
    (source) => {
      if (source === activeSource) return;
      if (activeSource === "narrate") speech.pause();
      if (activeSource === "audio") audioPlayer.pause();
      setActiveSource(source);
    },
    [activeSource, speech, audioPlayer]
  );

  const handleUploadAudio = useCallback(
    async (file) => {
      // For huge files (500MB) set in-memory immediately so playback can start
      // without waiting for IndexedDB. Persist in background without blocking UI.
      setLocalAudioFile(file);
      setActiveSource("audio");
      setAudioPersistWarning(false);
      if (!isDemo) {
        try {
          const ok = await attachAudioToBook(bookId, file);
          if (!ok && file.size > 80 * 1024 * 1024) {
            setAudioPersistWarning(true);
          }
        } catch {
          if (file.size > 80 * 1024 * 1024) setAudioPersistWarning(true);
        }
      }
    },
    [isDemo, attachAudioToBook, bookId]
  );

  const isPlaying = activeSource === "narrate" ? speech.speechState === "speaking" : audioPlayer.isPlaying;

  const playPause = useCallback(() => {
    if (activeSource === "narrate") {
      if (speech.speechState === "speaking") speech.pause();
      else if (speech.speechState === "paused") speech.resume();
      else {
        const start = speechChunks.findIndex((c) => c.page === leadPage);
        speech.play(start >= 0 ? start : 0);
      }
    } else {
      audioPlayer.toggle();
    }
  }, [activeSource, speech, audioPlayer, speechChunks, leadPage]);

  const playDisabled =
    activeSource === "narrate"
      ? !speech.supported || scanned || speechChunks.length === 0
      : !hasAudioFile;

  const volumeUp = useCallback(() => {
    const step = 0.1;
    if (activeSource === "narrate") {
      updateVoiceSettings({ volume: Math.min(1, +(voiceSettings.volume + step).toFixed(2)) });
    } else {
      audioPlayer.setVolume(Math.min(1, +(audioPlayer.volume + step).toFixed(2)));
    }
  }, [activeSource, voiceSettings.volume, updateVoiceSettings, audioPlayer]);

  const volumeDown = useCallback(() => {
    const step = 0.1;
    if (activeSource === "narrate") {
      updateVoiceSettings({ volume: Math.max(0, +(voiceSettings.volume - step).toFixed(2)) });
    } else {
      audioPlayer.setVolume(Math.max(0, +(audioPlayer.volume - step).toFixed(2)));
    }
  }, [activeSource, voiceSettings.volume, updateVoiceSettings, audioPlayer]);

  // ---- page zoom (in-app, so it works inside fullscreen too — browser
  // zoom either does nothing or zooms the whole chrome, not just the page) ----
  const [zoom, setZoom] = useState(1);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  // Ctrl+scroll (and trackpad pinch, which the browser reports as ctrl+wheel)
  // to zoom, attached natively (not React's onWheel, which is passive by
  // default and can't preventDefault) so it works even while the container
  // is the fullscreen element and never scrolls the whole page.
  //
  // Trackpad pinch fires a rapid burst of wheel events (tens of them for a
  // single short pinch), each with a sizeable deltaY. Scaling by a fixed
  // step per event (as with the +/- buttons) made a quick pinch jump the
  // zoom way too far, and even a per-event percentage compounds fast across
  // that many events — so the per-event sensitivity here is kept very low;
  // a sustained pinch still reaches full zoom, a quick one barely moves it.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = Math.max(-24, Math.min(24, e.deltaY));
      setZoom((z) => Math.min(2.5, Math.max(0.5, +(z * (1 - delta * 0.004)).toFixed(3))));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ---- fullscreen ----
  const fullscreen = useFullscreen(containerRef);
  const idleVisible = useIdleVisibility(fullscreen.isFullscreen);

  // Distraction-free lock: forces the chrome to stay hidden even while the
  // mouse is moving, instead of the normal idle-timer behavior where any
  // activity briefly reveals it again. Only meaningful in fullscreen, so
  // leaving fullscreen clears it rather than leaving it armed for next time.
  const [distractionFreeLock, setDistractionFreeLock] = useState(false);
  useEffect(() => {
    if (!fullscreen.isFullscreen) setDistractionFreeLock(false);
  }, [fullscreen.isFullscreen]);
  const toggleDistractionFreeLock = useCallback(() => setDistractionFreeLock((v) => !v), []);

  // ---- highlight mode: on while the user is actively drag-selecting text to
  // mark up. Independent of fullscreen — unlike the lock above, this needs to
  // work in normal windowed mode too. Erase mode is the same idea for
  // removing marks, and the two are mutually exclusive.
  const [highlightMode, setHighlightMode] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const toggleHighlightMode = useCallback(() => {
    setEraseMode(false);
    setHighlightMode((v) => !v);
  }, []);
  const toggleEraseMode = useCallback(() => {
    setHighlightMode(false);
    setEraseMode((v) => !v);
  }, []);

  // ---- sidebar ----
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("contents");
  const openSidebarTab = useCallback((tab) => {
    setSidebarTab(tab);
    setSidebarOpen(true);
  }, []);

  // Lock body scroll while the sidebar overlay is open so its appearance
  // can't toggle the scrollbar and shift the reading pane's measured width.
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const openAudioUpload = useCallback(() => {
    setSource("audio");
    openSidebarTab("audio");
  }, [setSource, openSidebarTab]);

  // Distraction-free fullscreen: chrome stays visible whenever the sidebar
  // is open (it's an explicit, deliberate action), otherwise it follows the
  // idle timer — visible on activity, fading out after a few seconds of rest.
  const chromeVisible = !distractionFreeLock && (idleVisible || sidebarOpen);
  const chromeHidden = fullscreen.isFullscreen && !chromeVisible;

  // ---- keyboard shortcuts ----
  useKeyboardShortcuts(
    {
      next: nextPage,
      prev: prevPage,
      playPause,
      volumeUp,
      volumeDown,
      zoomIn,
      zoomOut,
      zoomReset,
      fullscreen: fullscreen.toggle,
      bookmark: toggleBookmark,
      lock: toggleDistractionFreeLock,
      highlight: toggleHighlightMode,
      erase: toggleEraseMode,
      escape: () => {
        if (sidebarOpen) setSidebarOpen(false);
        else if (highlightMode || eraseMode) {
          setHighlightMode(false);
          setEraseMode(false);
        } else if (distractionFreeLock) setDistractionFreeLock(false);
        else if (fullscreen.isFullscreen) fullscreen.exit();
      },
    },
    true
  );

  // ---- drag & drop to replace book ----
  const [pendingFiles, setPendingFiles] = useState(null);
  const dragCounter = useRef(0);
  const [dragging, setDragging] = useState(false);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) => isPdfFile(f) || isAudioFile(f));
    if (files.length) setPendingFiles(files);
  }, []);
  const onDragOver = useCallback((e) => e.preventDefault(), []);
  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setDragging(true);
  }, []);
  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setDragging(false);
  }, []);

  const confirmReplace = useCallback(async () => {
    const files = pendingFiles || [];
    const pdf = files.find(isPdfFile) || null;
    const audio = files.find(isAudioFile) || null;
    setPendingFiles(null);
    const id = await addBook({ pdfFile: pdf, audioFile: audio });
    router.push(`/reader/${id}`);
  }, [pendingFiles, addBook, router]);

  const audioTitle = localAudioFile?.name || "Your audiobook";

  if (!isDemo && status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-xl italic text-[var(--ink)]">This PDF couldn&apos;t be opened.</p>
        <p className="max-w-sm text-sm text-[var(--ink-faint)]">
          It may be corrupted or in a format your browser can&apos;t read.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--bg)]"
        >
          Back to library
        </button>
      </div>
    );
  }

  const loading = !pageResolved || (!isDemo && status !== "ready");

  return (
    <div
      ref={containerRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`relative flex h-[100dvh] flex-col overflow-y-auto overscroll-none bg-[var(--bg)] ${chromeHidden ? "cursor-none" : ""}`}
    >
      {dragging && (
        <div className="pointer-events-none fixed inset-4 z-[90] rounded-3xl border-2 border-dashed border-[var(--accent)]" />
      )}

      <div
        className={`transition-opacity duration-500 ${
          // Sitting in the flex column (shrink-0) always reserves its height
          // whether or not it's actually visible — in fullscreen that meant
          // the book was permanently squeezed by the bar's height even after
          // it faded out, reading as a cut/gap at the top. Taking it out of
          // flow while fullscreen (it floats over the book instead) lets the
          // book use the full height as soon as the bar is hidden. Outside
          // fullscreen the bar never hides, so it stays in normal flow.
          fullscreen.isFullscreen
            ? "absolute inset-x-0 top-0 z-20 bg-[var(--bg)]/95 backdrop-blur-sm"
            : "shrink-0"
        } ${chromeHidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <ReaderTopBar
          title={title}
          author={author}
          onBack={() => router.push("/")}
          onOpenSidebar={() => openSidebarTab(sidebarTab)}
          isBookmarked={isBookmarked}
          onToggleBookmark={toggleBookmark}
          hasAudioFile={hasAudioFile}
          onAddAudio={openAudioUpload}
          pageLayout={pageLayout}
          onPageLayoutChange={setPageLayout}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <LoadingBook status={pdfHook.status} progress={pdfHook.progress} />
        ) : (
          <BookSpread
            flipRef={flipRef}
            currentPage={leadPage}
            pageCount={pageCount}
            isDemo={isDemo}
            pdfDoc={pdfHook.pdfDoc}
            pageAspect={isDemo ? null : pdfHook.pageAspect}
            demoPageTexts={demo?.pageTexts || []}
            activeChunk={activeChunk}
            fontSize={bookState.fontSize || "base"}
            pageLayout={pageLayout}
            reduceMotion={reduceMotion}
            zoom={zoom}
            onFlip={handleFlip}
            highlightMode={highlightMode}
            eraseMode={eraseMode}
            highlights={highlights}
            onAddHighlight={addHighlight}
            onRemoveHighlight={removeHighlight}
          />
        )}
      </div>

      <div
        className={`transition-opacity duration-500 ${
          chromeHidden ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ReadingControls
          onPrev={prevPage}
          onNext={nextPage}
          canPrev={canPrev}
          canNext={canNext}
          isPlaying={isPlaying}
          onPlayPause={playPause}
          playDisabled={playDisabled}
          currentPage={leadPage}
          pageCount={pageCount}
          activeSource={activeSource}
          voices={speech.voices}
          voiceName={voiceSettings.voiceName}
          onVoiceChange={(name) => updateVoiceSettings({ voiceName: name })}
          rate={activeSource === "narrate" ? voiceSettings.rate : audioPlayer.rate}
          onRateChange={(r) =>
            activeSource === "narrate" ? updateVoiceSettings({ rate: r }) : audioPlayer.setRate(r)
          }
          pitch={voiceSettings.pitch}
          onPitchChange={(p) => updateVoiceSettings({ pitch: p })}
          volume={activeSource === "narrate" ? voiceSettings.volume : audioPlayer.volume}
          onVolumeChange={(v) =>
            activeSource === "narrate" ? updateVoiceSettings({ volume: v }) : audioPlayer.setVolume(v)
          }
          isFullscreen={fullscreen.isFullscreen}
          onFullscreenToggle={fullscreen.toggle}
          distractionFreeLock={distractionFreeLock}
          onToggleDistractionFreeLock={toggleDistractionFreeLock}
          highlightMode={highlightMode}
          onToggleHighlightMode={toggleHighlightMode}
          eraseMode={eraseMode}
          onToggleEraseMode={toggleEraseMode}
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          hasAudioFile={hasAudioFile && !sidebarOpen}
          audioTitle={audioTitle}
          audioCurrentTime={audioPlayer.currentTime}
          audioDuration={audioPlayer.duration}
          onExpandAudio={() => openSidebarTab("audio")}
        />
      </div>

      {(highlightMode || eraseMode) && (
        // Deliberately outside the chromeHidden/distractionFreeLock opacity
        // wrappers above — this is the "toggle button reachable even in
        // distraction-free mode" affordance: it only appears once highlight
        // or erase mode is already on (via a button or a shortcut), so it
        // never intrudes otherwise, but it stays clickable through a full lock.
        <button
          type="button"
          onClick={highlightMode ? toggleHighlightMode : toggleEraseMode}
          className="pointer-events-auto fixed bottom-4 left-4 z-40 flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] font-medium text-[var(--ink-soft)] shadow-card"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          {highlightMode ? "Highlighting · H to exit" : "Erasing · E to exit"}
        </button>
      )}

      <ReadingSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tab={sidebarTab}
        onTabChange={setSidebarTab}
        pageCount={pageCount}
        currentPage={leadPage}
        onGoToPage={(n) => {
          goToPage(n);
          setSidebarOpen(false);
        }}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        onRemoveBookmark={removeBookmark}
        notes={notes}
        onNotesChange={onNotesChange}
        progressPct={pageCount ? (leadPage / pageCount) * 100 : 0}
        secondsRead={bookState.secondsRead || 0}
        activeSource={activeSource}
        onSourceChange={setSource}
        speech={speech}
        voiceSettings={voiceSettings}
        scanned={scanned}
        hasAudioFile={hasAudioFile}
        audioPlayer={audioPlayer}
        audioTitle={audioTitle}
        onUploadAudio={handleUploadAudio}
      />

      {/* display:none can leave the media pipeline uninitialized in some
           browsers (WebKit in particular) — keep it out of the visual flow
           without display:none so playback stays reliable. */}
      {audioUrl && (
        <audio
          key={audioUrl}
          ref={audioPlayer.audioRef}
          src={audioUrl}
          preload="metadata"
          playsInline
          // crossOrigin intentionally omitted for blob: URLs — setting
          // anonymous on blob URLs breaks decoding in some browsers and
          // is not needed for same-origin MediaElementSource
          style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      )}

      {hasAudioFile && audioPlayer.error && (
        <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-28">
          <div className="flex max-w-[min(92vw,480px)] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-card">
            <p className="flex-1 text-xs leading-relaxed text-[var(--ink-soft)]">{audioPlayer.error}</p>
            <button
              type="button"
              onClick={() => {
                setActiveSource("audio");
                audioReplaceInputRef.current?.click();
              }}
              className="shrink-0 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-medium text-[var(--bg)]"
            >
              Upload new file
            </button>
          </div>
        </div>
      )}
      {audioPersistWarning && !audioPlayer.error && (
        <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-28">
          <div className="flex max-w-[min(92vw,520px)] items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-card">
            <p className="flex-1 text-xs leading-relaxed text-amber-900">
              Large audio ({Math.round((localAudioFile?.size || 0) / 1024 / 1024)} MB) is playing from memory. It may not persist after reload due to browser storage limits.
            </p>
            <button
              type="button"
              onClick={() => setAudioPersistWarning(false)}
              className="shrink-0 rounded-full bg-amber-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {/* Always-mounted hidden input so the “Upload new file” prompt works even when the Audio sidebar is closed */}
      <input
        ref={audioReplaceInputRef}
        type="file"
        accept={AUDIO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUploadAudio(file);
            e.target.value = "";
          }
        }}
      />

      <ConfirmDialog
        open={showContinuePrompt}
        title="Continue reading?"
        message={`You were on page ${bookState.currentPage}. Pick up where you left off, or start from the beginning.`}
        confirmLabel="Continue"
        onConfirm={() => setShowContinuePrompt(false)}
        onCancel={() => {
          setCurrentPage(1);
          flipRef.current?.pageFlip?.()?.turnToPage(0);
          setShowContinuePrompt(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingFiles)}
        title="Replace this book?"
        message="Dropping a new file will add it as a new book in your library and open it, leaving this one untouched."
        confirmLabel="Open new book"
        onConfirm={confirmReplace}
        onCancel={() => setPendingFiles(null)}
      />
    </div>
  );
}
