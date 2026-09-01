"use client";

import { motion } from "framer-motion";

export function LoadingBook({ status, progress }) {
  const label =
    status === "loading"
      ? "Preparing your book…"
      : status === "extracting"
      ? `Rendering page ${progress?.done ?? 0} of ${progress?.total ?? "…"}`
      : "Loading…";

  const pct = progress?.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-5 px-6">
      <motion.div
        className="h-10 w-8 rounded-sm border border-[var(--border)] bg-[var(--bg-elevated)] shadow-page"
        animate={{ rotateY: [0, 25, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      />
      <p className="font-sans text-sm text-[var(--ink-soft)]">{label}</p>
      <div className="h-1 w-56 overflow-hidden rounded-full bg-[var(--border)]">
        <motion.div
          className="h-full rounded-full bg-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${status === "extracting" ? pct : 15}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}
