"use client";

import { AnimatePresence, motion } from "framer-motion";

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const PITCHES = [0.8, 1.0, 1.2];

export function VoiceSettings({
  open,
  voices,
  voiceName,
  onVoiceChange,
  rate,
  onRateChange,
  pitch,
  onPitchChange,
  volume,
  onVolumeChange,
  showVoice = true,
  showPitch = true,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="absolute bottom-full right-0 mb-3 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-card"
          role="dialog"
          aria-label="Voice settings"
        >
          {showVoice && (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">Voice</label>
              <select
                value={voiceName || ""}
                onChange={(e) => onVoiceChange(e.target.value || null)}
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
              >
                {voices.length === 0 && <option value="">No voices available</option>}
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">Speed</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRateChange(r)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    rate === r ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--bg)] text-[var(--ink-soft)] hover:bg-[var(--border)]"
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {showPitch && (
            <div className="mt-4">
              <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">Pitch</label>
              <div className="mt-1.5 flex gap-1.5">
                {PITCHES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPitchChange(p)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      pitch === p ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--bg)] text-[var(--ink-soft)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
            />
          </div>

          {showVoice && (
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-faint)]">
              Uses your device's built-in speech voices. Quality depends on what's installed on your device.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
