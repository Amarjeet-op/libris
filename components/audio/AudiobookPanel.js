"use client";

import { useRef } from "react";
import { Mic, Headphones, Upload } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { VoiceSettings } from "./VoiceSettings";

const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg,.webm,audio/*";

export function AudiobookPanel({
  activeSource,
  onSourceChange,
  speech,
  voiceSettings,
  onVoiceSettingsChange,
  scanned,
  hasAudioFile,
  audioPlayer,
  audioTitle,
  onUploadAudio,
}) {
  const inputRef = useRef(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--bg)] p-1">
        <button
          type="button"
          onClick={() => onSourceChange("narrate")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors ${
            activeSource === "narrate" ? "bg-[var(--bg-elevated)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-faint)]"
          }`}
        >
          <Mic size={14} strokeWidth={1.75} />
          Narrate PDF
        </button>
        <button
          type="button"
          onClick={() => onSourceChange("audio")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors ${
            activeSource === "audio" ? "bg-[var(--bg-elevated)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-faint)]"
          }`}
        >
          <Headphones size={14} strokeWidth={1.75} />
          My Audiobook
        </button>
      </div>

      {activeSource === "narrate" ? (
        !speech.supported ? (
          <p className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            Your browser doesn't support speech synthesis, so narration isn't available here.
          </p>
        ) : scanned ? (
          <p className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            This PDF appears to contain scanned images rather than selectable text. Browser-only
            narration can't reliably extract text from it.
          </p>
        ) : speech.voices.length === 0 ? (
          <p className="rounded-xl bg-[var(--bg)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            No speech voices are available on your device yet.
          </p>
        ) : (
          <div className="relative rounded-xl bg-[var(--bg)] px-4 py-3">
            <p className="text-sm text-[var(--ink-soft)]">
              Voice: <span className="font-medium text-[var(--ink)]">{voiceSettings.voiceName || "Automatic"}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              Speed {voiceSettings.rate}x · Pitch {voiceSettings.pitch}
            </p>
            <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
              Uses your device's built-in speech voices. Adjust from the control bar below.
            </p>
          </div>
        )
      ) : hasAudioFile ? (
        <div className="flex flex-col gap-3">
          <AudioPlayer
            player={audioPlayer}
            title={audioTitle}
            subtitle="Your audiobook"
            onReplace={() => inputRef.current?.click()}
          />
          {/* Always allow replacing — especially when the current file failed to decode */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--ink-faint)]">
              {audioPlayer.error ? "That file couldn't be played." : "Want a different narration?"}
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              {audioPlayer.error ? "Replace file" : "Replace audio"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
          <Upload size={18} strokeWidth={1.75} className="text-[var(--ink-faint)]" />
          <p className="text-sm text-[var(--ink-soft)]">Bring your own narration.</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-medium text-[var(--bg)]"
          >
            Upload audio file
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={AUDIO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUploadAudio(file);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
