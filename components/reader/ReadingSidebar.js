"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Bookmark, StickyNote, BarChart3, Headphones, Trash2 } from "lucide-react";
import { AudiobookPanel } from "@/components/audio/AudiobookPanel";

const TABS = [
  { id: "contents", label: "Contents", icon: BookOpen },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "audio", label: "Audio", icon: Headphones },
];

export function ReadingSidebar({
  open,
  onClose,
  tab,
  onTabChange,
  pageCount,
  currentPage,
  onGoToPage,
  bookmarks,
  onToggleBookmark,
  onRemoveBookmark,
  notes,
  onNotesChange,
  progressPct,
  secondsRead,
  activeSource,
  onSourceChange,
  speech,
  voiceSettings,
  scanned,
  hasAudioFile,
  audioPlayer,
  audioTitle,
  onUploadAudio,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] shadow-card"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-sans text-sm font-semibold text-[var(--ink)]">Reader panel</h2>
              <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-soft)] hover:bg-[var(--bg)]"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex border-b border-[var(--border)] px-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange(t.id)}
                  aria-label={t.label}
                  title={t.label}
                  className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-1 py-3 text-[10px] font-medium transition-colors ${
                    tab === t.id
                      ? "border-[var(--ink)] text-[var(--ink)]"
                      : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
                  }`}
                >
                  <t.icon size={16} strokeWidth={1.75} />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tab === "contents" && (
                <div>
                  <p className="mb-3 text-xs text-[var(--ink-faint)]">
                    Chapter detection isn't available for this book, so here's every page.
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onGoToPage(n)}
                        className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                          n === currentPage
                            ? "bg-[var(--ink)] text-[var(--bg)]"
                            : "bg-[var(--bg)] text-[var(--ink-soft)] hover:bg-[var(--border)]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === "bookmarks" && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onToggleBookmark}
                    className="mb-2 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-medium text-[var(--bg)]"
                  >
                    {bookmarks.includes(currentPage) ? "Remove bookmark on this page" : "Bookmark this page"}
                  </button>
                  {bookmarks.length === 0 ? (
                    <p className="text-sm text-[var(--ink-faint)]">No bookmarks yet.</p>
                  ) : (
                    [...bookmarks]
                      .sort((a, b) => a - b)
                      .map((p) => (
                        <div
                          key={p}
                          className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2"
                        >
                          <button type="button" onClick={() => onGoToPage(p)} className="text-sm text-[var(--ink)]">
                            Page {p}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove bookmark on page ${p}`}
                            onClick={() => onRemoveBookmark(p)}
                            className="text-[var(--ink-faint)] hover:text-[var(--ink)]"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}

              {tab === "notes" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[var(--ink-faint)]">
                    Notes for page {currentPage} — saved on this device only.
                  </label>
                  <textarea
                    value={notes[currentPage] || ""}
                    onChange={(e) => onNotesChange(currentPage, e.target.value)}
                    placeholder="Write a note about this page..."
                    rows={8}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink-faint)]"
                  />
                </div>
              )}

              {tab === "progress" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-xs text-[var(--ink-faint)]">
                      <span>Progress</span>
                      <span>{Math.round(progressPct)}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--ink-faint)]">Page</p>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {currentPage} of {pageCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--bg)] px-4 py-3">
                    <p className="text-xs text-[var(--ink-faint)]">Time in this book</p>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {secondsRead < 60 ? `${secondsRead}s` : `${Math.round(secondsRead / 60)} min`}
                    </p>
                  </div>
                </div>
              )}

              {tab === "audio" && (
                <AudiobookPanel
                  activeSource={activeSource}
                  onSourceChange={onSourceChange}
                  speech={speech}
                  voiceSettings={voiceSettings}
                  scanned={scanned}
                  hasAudioFile={hasAudioFile}
                  audioPlayer={audioPlayer}
                  audioTitle={audioTitle}
                  onUploadAudio={onUploadAudio}
                />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
