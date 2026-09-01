"use client";

import { motion } from "framer-motion";
import { Headphones, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getBookState } from "@/lib/storage";

const COVER_PALETTES = [
  ["#7c3f2b", "#b4522f"],
  ["#2f4a3e", "#4f7a63"],
  ["#2a3a52", "#4a6690"],
  ["#4a3352", "#7a5a90"],
  ["#5a4326", "#8a6a3a"],
];

function paletteFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % COVER_PALETTES.length;
  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length];
}

export function BookCard({ book, onRemove }) {
  const router = useRouter();
  const state = getBookState(book.id);
  const progress = Math.round(state.progress || 0);
  const [c1, c2] = paletteFor(book.id);

  return (
    <motion.div
      className="group flex flex-col"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.button
        type="button"
        onClick={() => router.push(`/reader/${book.id}`)}
        aria-label={`Open ${book.title}`}
        className="relative aspect-[3/4.4] w-full overflow-hidden rounded-md text-left shadow-card"
        whileHover={{ rotate: -1.5 }}
        style={{
          background: `linear-gradient(155deg, ${c1}, ${c2})`,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_40%)]" />
        <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex items-center gap-1.5 text-white/70">
            {book.hasAudio && <Headphones size={13} strokeWidth={2} />}
            {book.hasPdf && <FileText size={13} strokeWidth={2} />}
          </div>
          <div>
            <p className="font-serif text-lg italic leading-snug text-white drop-shadow-sm">
              {book.title}
            </p>
            <p className="mt-1 text-xs text-white/70">{book.author}</p>
          </div>
        </div>
        {onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Remove ${book.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(book.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onRemove(book.id);
              }
            }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          >
            <Trash2 size={13} strokeWidth={2} />
          </span>
        )}
      </motion.button>

      <div className="mt-2.5 px-0.5">
        <p className="truncate font-sans text-sm font-medium text-[var(--ink)]">{book.title}</p>
        <p className="text-xs text-[var(--ink-faint)]">
          {progress > 0 ? `${progress}% complete` : "Not started"}
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
