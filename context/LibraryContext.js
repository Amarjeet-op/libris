"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { generateId } from "@/lib/id";
import { putFile, getFile, deleteFile } from "@/lib/db";
import { resolveAudioMimeType } from "@/lib/fileType";
import {
  getLibrary,
  setLibrary,
  getTheme,
  setTheme as persistTheme,
  getBookState,
  setBookState,
  deleteBookState,
} from "@/lib/storage";

function withCorrectAudioMime(file) {
  if (!file) return file;
  const mime = resolveAudioMimeType(file);
  if (mime === file.type) return file;
  // For large files (e.g. 500MB MP3) `new Blob([file])` would copy the entire
  // buffer into memory → OOM. `slice` is zero-copy and preserves the data.
  try {
    const sliced = file.slice(0, file.size, mime);
    try {
      Object.defineProperty(sliced, "name", { value: file.name });
    } catch {}
    return sliced;
  } catch {
    // If slice fails (old browser), return original — browser will sniff
    // content anyway and blob URL will still play for most MP3/WAV.
    return file;
  }
}

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [theme, setThemeState] = useState("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBooks(getLibrary());
    setThemeState(getTheme());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.remove("dark", "sepia");
    if (theme === "dark") document.documentElement.classList.add("dark");
    if (theme === "sepia") document.documentElement.classList.add("sepia");
  }, [theme, hydrated]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    persistTheme(next);
  }, []);

  const addBook = useCallback(async ({ pdfFile, audioFile, title, author }) => {
    const id = generateId();
    if (pdfFile) await putFile(`${id}:pdf`, pdfFile, { name: pdfFile.name });
    const normalizedAudio = withCorrectAudioMime(audioFile);
    if (normalizedAudio) {
      const ok = await putFile(`${id}:audio`, normalizedAudio, { name: normalizedAudio.name || audioFile.name });
      if (!ok && normalizedAudio.size > 100 * 1024 * 1024) {
        console.warn("[addBook] Large audio (>100MB) not persisted — will stay in-memory for this session");
      }
    }

    const meta = {
      id,
      title: title || pdfFile?.name?.replace(/\.pdf$/i, "") || audioFile?.name || "Untitled",
      author: author || "Unknown author",
      hasPdf: Boolean(pdfFile),
      hasAudio: Boolean(audioFile),
      addedAt: Date.now(),
    };

    setBooks((prev) => {
      const next = [meta, ...prev];
      setLibrary(next);
      return next;
    });

    return id;
  }, []);

  const attachAudioToBook = useCallback(async (id, audioFile) => {
    const normalized = withCorrectAudioMime(audioFile);
    const ok = await putFile(`${id}:audio`, normalized, { name: normalized.name || audioFile.name });
    if (!ok && normalized?.size > 100 * 1024 * 1024) {
      console.warn("[attachAudio] Large audio (>100MB) not persisted — in-memory only");
    }
    setBooks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, hasAudio: true } : b));
      setLibrary(next);
      return next;
    });
    return ok;
  }, []);

  const removeBook = useCallback(async (id) => {
    await deleteFile(`${id}:pdf`);
    await deleteFile(`${id}:audio`);
    deleteBookState(id);
    setBooks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      setLibrary(next);
      return next;
    });
  }, []);

  const updateBookMeta = useCallback((id, patch) => {
    setBooks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
      setLibrary(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      books,
      theme,
      hydrated,
      setTheme,
      addBook,
      attachAudioToBook,
      removeBook,
      updateBookMeta,
    }),
    [books, theme, hydrated, setTheme, addBook, attachAudioToBook, removeBook, updateBookMeta]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}

// Standalone helpers for reader pages (not tied to the provider's book list)
export async function loadBookFile(id, kind) {
  const record = await getFile(`${id}:${kind}`);
  if (!record?.blob) return null;
  // IndexedDB stores the raw Blob; the original File.name lives in `record.name`.
  // Re-attach it so mime-type resolution and the audio title can use it.
  if (record.name && !record.blob.name) {
    try {
      Object.defineProperty(record.blob, "name", { value: record.name });
    } catch {
      // fallback: wrap so `.name` exists without copying bytes when possible
      try {
        const withName = record.blob.slice(0, record.blob.size, record.blob.type);
        Object.defineProperty(withName, "name", { value: record.name });
        return withName;
      } catch {}
    }
  }
  return record.blob;
}

const BOOK_STATE_FALLBACK = {
  currentPage: 1,
  progress: 0,
  bookmarks: [],
  secondsRead: 0,
  lastOpenedAt: null,
  audioTime: 0,
};

export function useBookState(id) {
  // Hydration-safe: server and initial client render must match.
  // Read persisted state only after mount to avoid server (fallback)
  // vs client (real localStorage) mismatch → React error #418.
  const [state, setState] = useState(BOOK_STATE_FALLBACK);

  useEffect(() => {
    setState(getBookState(id));
  }, [id]);

  const update = useCallback(
    (patch) => {
      setState((prev) => {
        const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
        setBookState(id, next);
        return next;
      });
    },
    [id]
  );

  return [state, update];
}
