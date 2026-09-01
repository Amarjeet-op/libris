"use client";

import { useEffect, useRef, useState } from "react";

// Draws live bars sampled from getBars() while playing; when idle (or if Web
// Audio isn't available — getBars() falls back to a flat baseline) it shows
// a gentle animated placeholder instead of a frozen flat line.
export function Waveform({ getBars, isPlaying, barCount = 40, className = "" }) {
  const [bars, setBars] = useState(() => new Array(barCount).fill(0.12));
  const rafRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    function tick() {
      tRef.current += 1;
      if (isPlaying) {
        const live = getBars?.(barCount);
        const hasSignal = live?.some((v) => v > 0.1);
        if (hasSignal) {
          setBars(live);
        } else {
          setBars(
            new Array(barCount)
              .fill(0)
              .map((_, i) => 0.18 + 0.16 * Math.abs(Math.sin(tRef.current / 8 + i / 2)))
          );
        }
      } else {
        setBars((prev) => prev.map((v) => Math.max(0.08, v * 0.9)));
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [getBars, isPlaying, barCount]);

  return (
    <div className={`flex h-8 items-center gap-[3px] ${className}`} aria-hidden="true">
      {bars.map((v, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[var(--accent)] transition-[height] duration-100"
          style={{ height: `${Math.max(8, v * 100)}%`, opacity: isPlaying ? 0.85 : 0.35 }}
        />
      ))}
    </div>
  );
}
