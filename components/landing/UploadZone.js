"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const ACCEPT = ".pdf,.mp3,.wav,.m4a,.aac,.ogg,.webm,audio/*,application/pdf";

export function UploadZone({ onFiles, compact = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (files.length) onFiles?.(files);
    },
    [onFiles]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

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

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg)] active:scale-[0.98]"
      >
        <Plus size={15} strokeWidth={2} />
        Add book
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </button>
    );
  }

  return (
    <motion.div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      animate={{
        scale: dragging ? 1.015 : 1,
        borderColor: dragging ? "var(--accent)" : "var(--border)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-[28px] border-2 border-dashed bg-[var(--bg-elevated)]/60 px-10 py-16 text-center"
      style={{ borderColor: dragging ? "var(--accent)" : "var(--border)" }}
    >
      <motion.div
        animate={{ y: dragging ? -4 : 0 }}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)]"
      >
        <Plus size={22} strokeWidth={1.75} />
      </motion.div>
      <div>
        <p className="font-sans text-[15px] font-medium text-[var(--ink)]">Drop your book</p>
        <p className="mt-1 text-sm text-[var(--ink-faint)]">PDF, or an audiobook file (MP3, WAV, M4A…)</p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-1 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--bg)] transition-transform active:scale-95"
      >
        Choose a file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </motion.div>
  );
}
