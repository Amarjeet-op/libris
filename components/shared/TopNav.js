"use client";

import { Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const TABS = [
  { id: "library", label: "Library" },
  { id: "audiobooks", label: "Audiobooks" },
];

export function TopNav({ section, onSection, continueBook, onContinue, onSettings }) {
  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <div className="flex items-center gap-8">
        <span className="font-serif text-lg font-bold italic tracking-tight text-[var(--ink)]">
          LIBRIS
        </span>
        <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSection(tab.id)}
              className={`text-sm font-medium transition-colors ${
                section === tab.id ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onContinue}
            disabled={!continueBook}
            className={`text-sm font-medium transition-colors ${
              continueBook
                ? "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                : "cursor-not-allowed text-[var(--ink-faint)] opacity-40"
            }`}
            title={continueBook ? `Continue "${continueBook.title}"` : "Open a book to continue reading"}
          >
            Reader
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Settings"
          onClick={onSettings}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-faint)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--ink)]"
        >
          <Settings size={17} strokeWidth={1.75} />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
