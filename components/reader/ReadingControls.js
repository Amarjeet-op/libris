"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SlidersHorizontal,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  BookOpen,
  Highlighter,
  Eraser,
} from "lucide-react";
import { VoiceSettings } from "@/components/audio/VoiceSettings";
import { formatDuration } from "@/lib/id";

export function ReadingControls({
  onPrev,
  onNext,
  canPrev,
  canNext,
  isPlaying,
  onPlayPause,
  playDisabled,
  currentPage,
  pageCount,
  activeSource,
  voices,
  voiceName,
  onVoiceChange,
  rate,
  onRateChange,
  pitch,
  onPitchChange,
  volume,
  onVolumeChange,
  isFullscreen,
  onFullscreenToggle,
  distractionFreeLock,
  onToggleDistractionFreeLock,
  highlightMode,
  onToggleHighlightMode,
  eraseMode,
  onToggleEraseMode,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  hasAudioFile,
  audioTitle,
  audioCurrentTime = 0,
  audioDuration = 0,
  onExpandAudio,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Was a separate floating MiniPlayer bar stacked above this one — folded in
  // here instead so there's a single bottom bar, not two.
  const showAudioRow = activeSource === "audio" && hasAudioFile && audioDuration > 0;
  const audioPct = audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-5 sm:pb-7">
      <div
        className={`pointer-events-auto flex w-full max-w-xl flex-col border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-card ${
          showAudioRow ? "rounded-2xl" : "rounded-full"
        }`}
      >
        {showAudioRow && (
          // overflow-hidden scoped to just this row (not the whole bar below) —
          // the voice-settings popover further down is absolutely positioned
          // *above* its row, and clipping it at the outer container would make
          // it invisible instead of floating over the book.
          <div className="overflow-hidden rounded-t-2xl">
            <div className="h-0.5 w-full bg-[var(--border)]">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${audioPct}%` }} />
            </div>
            <button
              type="button"
              onClick={onExpandAudio}
              className="flex w-full items-center gap-2.5 border-b border-[var(--border)] px-4 py-2 text-left"
              aria-label={`Expand player for ${audioTitle}`}
            >
              <BookOpen size={14} strokeWidth={1.75} className="shrink-0 text-[var(--ink-faint)]" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--ink)]">{audioTitle}</span>
              <span className="hidden shrink-0 text-[11px] text-[var(--ink-faint)] sm:inline">
                {formatDuration(audioCurrentTime)} / {formatDuration(audioDuration)}
              </span>
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5">
          <button
            type="button"
            aria-label="Previous page"
            onClick={onPrev}
            disabled={!canPrev}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)] disabled:opacity-30"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            aria-label={isPlaying ? "Pause narration" : "Play narration"}
            onClick={onPlayPause}
            disabled={playDisabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--bg)] transition-transform active:scale-95 disabled:opacity-30"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <button
            type="button"
            aria-label="Next page"
            onClick={onNext}
            disabled={!canNext}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)] disabled:opacity-30"
          >
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>

          <div className="mx-1 hidden min-w-0 flex-1 flex-col items-center leading-tight sm:flex">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-soft)]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${isPlaying ? "bg-[var(--accent)]" : "bg-[var(--ink-faint)]"}`}
              />
              {isPlaying ? "Playing" : "Paused"}
            </span>
            <span className="text-[11px] text-[var(--ink-faint)]">
              Page {currentPage} of {pageCount}
            </span>
          </div>

          {/* min-w-0 lets this shrink below its content width so overflow-x-auto can
              actually kick in on narrow screens instead of the icons spilling past the
              pill's rounded edge (the outer bar has no overflow clip, since that would
              also clip the VoiceSettings popover below) */}
          <div className="ml-auto flex min-w-0 items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={onZoomOut}
              disabled={zoom <= 0.5}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)] disabled:opacity-30"
            >
              <ZoomOut size={16} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={onZoomReset}
              className="hidden min-w-[2.5rem] text-center text-[11px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)] sm:block"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={onZoomIn}
              disabled={zoom >= 2.5}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)] disabled:opacity-30"
            >
              <ZoomIn size={16} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Playback settings"
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)]"
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={highlightMode ? "Exit highlight mode" : "Highlight text"}
              title="Highlight text (H)"
              onClick={onToggleHighlightMode}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg)] ${
                highlightMode ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"
              }`}
            >
              <Highlighter size={16} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={eraseMode ? "Exit erase mode" : "Erase highlights"}
              title="Erase highlights (E)"
              onClick={onToggleEraseMode}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg)] ${
                eraseMode ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"
              }`}
            >
              <Eraser size={16} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={onFullscreenToggle}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)]"
            >
              {isFullscreen ? <Minimize size={16} strokeWidth={1.75} /> : <Maximize size={16} strokeWidth={1.75} />}
            </button>
            {isFullscreen && (
              <button
                type="button"
                aria-label={distractionFreeLock ? "Exit distraction-free lock" : "Lock into distraction-free mode"}
                title="Distraction-free lock (D) — hides this bar even while moving the mouse"
                onClick={onToggleDistractionFreeLock}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1 transition-colors hover:bg-[var(--bg)] ${
                  distractionFreeLock ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"
                }`}
              >
                {distractionFreeLock ? <Lock size={16} strokeWidth={1.75} /> : <Unlock size={16} strokeWidth={1.75} />}
                <span className="text-[9px] font-medium leading-none">
                  {distractionFreeLock ? "Locked" : "Lock"}
                </span>
              </button>
            )}
          </div>
          </div>

          <VoiceSettings
            open={settingsOpen}
            voices={voices}
            voiceName={voiceName}
            onVoiceChange={onVoiceChange}
            rate={rate}
            onRateChange={onRateChange}
            pitch={pitch}
            onPitchChange={onPitchChange}
            volume={volume}
            onVolumeChange={onVolumeChange}
            showVoice={activeSource === "narrate"}
            showPitch={activeSource === "narrate"}
          />
        </div>
      </div>
    </div>
  );
}
