"use client";

import { ArrowLeft, PanelRight, Bookmark, Headphones, Book, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function ReaderTopBar({
  title,
  author,
  onBack,
  onOpenSidebar,
  isBookmarked,
  onToggleBookmark,
  hasAudioFile,
  onAddAudio,
  pageLayout,
  onPageLayoutChange,
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Back to library"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-elevated)]"
        >
          <ArrowLeft size={17} strokeWidth={1.75} />
        </button>
        <div className="min-w-0">
          <p className="truncate font-serif text-[15px] italic text-[var(--ink)]">{title}</p>
          {author && <p className="truncate text-xs text-[var(--ink-faint)]">{author}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
          onClick={onToggleBookmark}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-elevated)]"
        >
          <Bookmark
            size={16}
            strokeWidth={1.75}
            className={isBookmarked ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--ink-soft)]"}
          />
        </button>

        <button
          type="button"
          aria-label={pageLayout === "single" ? "Switch to two-page spread" : "Switch to single page"}
          title={pageLayout === "single" ? "Switch to two-page spread" : "Switch to single page"}
          onClick={() => onPageLayoutChange(pageLayout === "single" ? "double" : "single")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-elevated)]"
        >
          {pageLayout === "single" ? (
            <Book size={17} strokeWidth={1.75} />
          ) : (
            <BookOpen size={17} strokeWidth={1.75} />
          )}
        </button>

        <button
          type="button"
          aria-label={hasAudioFile ? "Manage your audiobook" : "Add your own audiobook"}
          title={hasAudioFile ? "Manage your audiobook" : "Add your own audiobook"}
          onClick={onAddAudio}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-elevated)]"
        >
          <Headphones size={17} strokeWidth={1.75} className={hasAudioFile ? "text-[var(--accent)]" : ""} />
          {hasAudioFile && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </button>

        <ThemeToggle />

        <button
          type="button"
          aria-label="Open reader panel"
          onClick={onOpenSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-elevated)]"
        >
          <PanelRight size={17} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
