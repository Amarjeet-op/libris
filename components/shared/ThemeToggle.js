"use client";

import { Sun, Moon, BookOpen } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";

const OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "sepia", label: "Sepia", icon: BookOpen },
  { id: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useLibrary();

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] p-1 ${className}`}
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          aria-label={`${label} theme`}
          onClick={() => setTheme(id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
            theme === id
              ? "bg-[var(--ink)] text-[var(--bg)]"
              : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
          }`}
        >
          <Icon size={15} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
