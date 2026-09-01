"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Gauge } from "lucide-react";
import { formatDuration } from "@/lib/id";
import { Waveform } from "./Waveform";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

// Visual controls only — the actual <audio> element and playback state live
// in the `player` object (from useAudioPlayer) so they stay mounted even
// when this component and MiniPlayer swap in and out.
export function AudioPlayer({ player, title, subtitle, onReplace }) {
  const [showSpeed, setShowSpeed] = useState(false);
  const pct = player.duration ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-medium text-[var(--ink)]">{title}</p>
          {subtitle && <p className="truncate text-xs text-[var(--ink-faint)]">{subtitle}</p>}
        </div>
        <Waveform getBars={player.getBars} isPlaying={player.isPlaying} barCount={28} className="hidden sm:flex" />
      </div>

      {player.error ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-[var(--bg)] px-3 py-3">
          <p className="text-sm text-[var(--ink-soft)]">{player.error}</p>
          <p className="text-xs text-[var(--ink-faint)]">Try MP3 or WAV for best compatibility.</p>
          {onReplace && (
            <button
              type="button"
              onClick={onReplace}
              className="self-start rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-medium text-[var(--bg)]"
            >
              Choose another file
            </button>
          )}
        </div>
      ) : !player.ready ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-[var(--bg)] px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--ink)]" />
            <p className="text-sm text-[var(--ink-soft)]">Loading audio…</p>
          </div>
          <p className="text-xs text-[var(--ink-faint)]">
            Large files (e.g. 500 MB) may take a moment to prepare. Playback will be ready shortly. If it stays here, try a smaller MP3.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={player.duration || 0}
              step={0.1}
              value={player.currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              aria-label="Seek"
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
              style={{
                background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`,
              }}
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-[var(--ink-faint)]">
              <span>{formatDuration(player.currentTime)}</span>
              <span>-{formatDuration(Math.max(0, player.duration - player.currentTime))}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Back 10 seconds"
                onClick={() => player.skip(-10)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)]"
              >
                <RotateCcw size={17} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                aria-label={player.isPlaying ? "Pause" : "Play"}
                onClick={player.toggle}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--bg)] transition-transform active:scale-95"
              >
                {player.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <button
                type="button"
                aria-label="Forward 10 seconds"
                onClick={() => player.skip(10)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)]"
              >
                <RotateCw size={17} strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Playback speed"
                  onClick={() => setShowSpeed((v) => !v)}
                  className="flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)]"
                >
                  <Gauge size={15} strokeWidth={1.75} />
                  {player.rate}x
                </button>
                {showSpeed && (
                  <div className="absolute bottom-11 right-0 flex flex-col gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-card">
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          player.setRate(s);
                          setShowSpeed(false);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-left text-xs ${
                          player.rate === s ? "bg-[var(--bg)] font-semibold text-[var(--ink)]" : "text-[var(--ink-soft)]"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  aria-label={player.volume === 0 ? "Unmute" : "Mute"}
                  onClick={() => player.setVolume(player.volume === 0 ? 1 : 0)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg)]"
                >
                  {player.volume === 0 ? <VolumeX size={16} strokeWidth={1.75} /> : <Volume2 size={16} strokeWidth={1.75} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={player.volume}
                  onChange={(e) => player.setVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
