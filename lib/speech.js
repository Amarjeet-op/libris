// Wraps window.speechSynthesis with a per-chunk utterance queue. Chrome/Edge's
// `boundary` event is unreliable across voices, so instead we speak one
// SpeechSynthesisUtterance per sentence chunk and advance on `onend` — this
// gives dependable chunk-level (not word-level) sync.

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getVoices() {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function pickDefaultVoice(voices, lang = "en") {
  if (!voices.length) return null;
  const byLang = voices.filter((v) => v.lang?.toLowerCase().startsWith(lang));
  const pool = byLang.length ? byLang : voices;
  const preferredNames = ["Samantha", "Google US English", "Microsoft Zira", "Microsoft David"];
  for (const name of preferredNames) {
    const found = pool.find((v) => v.name.includes(name));
    if (found) return found;
  }
  const defaultVoice = pool.find((v) => v.default);
  return defaultVoice || pool[0];
}

export class SpeechController {
  constructor({ onChunkStart, onChunkEnd, onStateChange, onError } = {}) {
    this.chunks = [];
    this.index = -1;
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.state = "idle"; // idle | speaking | paused
    this.onChunkStart = onChunkStart || (() => {});
    this.onChunkEnd = onChunkEnd || (() => {});
    this.onStateChange = onStateChange || (() => {});
    this.onError = onError || (() => {});
    this._gen = 0;
  }

  setVoice(voice) {
    this.voice = voice;
  }

  setRate(rate) {
    this.rate = rate;
  }

  setPitch(pitch) {
    this.pitch = pitch;
  }

  setVolume(volume) {
    this.volume = volume;
  }

  _setState(state) {
    this.state = state;
    this.onStateChange(state);
  }

  load(chunks) {
    this.stop();
    this.chunks = chunks;
    this.index = -1;
  }

  play(startIndex = 0) {
    if (!isSpeechSupported() || this.chunks.length === 0) return;
    this._gen += 1;
    this.index = Math.max(0, Math.min(startIndex, this.chunks.length - 1));
    this._speakCurrent(this._gen);
  }

  _speakCurrent(gen) {
    if (gen !== this._gen || this.index < 0 || this.index >= this.chunks.length) {
      if (gen === this._gen) this._setState("idle");
      return;
    }
    const chunk = this.chunks[this.index];
    const utter = new SpeechSynthesisUtterance(chunk.text);
    if (this.voice) utter.voice = this.voice;
    utter.rate = this.rate;
    utter.pitch = this.pitch;
    utter.volume = this.volume;

    utter.onstart = () => {
      if (gen !== this._gen) return;
      this._setState("speaking");
      this.onChunkStart(chunk, this.index);
    };
    utter.onend = () => {
      if (gen !== this._gen) return;
      this.onChunkEnd(chunk, this.index);
      this.index += 1;
      this._speakCurrent(gen);
    };
    utter.onerror = (e) => {
      if (gen !== this._gen) return;
      this.onError(e);
      this.index += 1;
      this._speakCurrent(gen);
    };

    this._utter = utter;
    window.speechSynthesis.speak(utter);
  }

  pause() {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.pause();
    this._setState("paused");
  }

  resume() {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.resume();
    this._setState("speaking");
  }

  stop() {
    if (!isSpeechSupported()) return;
    this._gen += 1;
    window.speechSynthesis.cancel();
    this._setState("idle");
  }

  next() {
    this.stop();
    this.play(Math.min(this.index + 1, this.chunks.length - 1));
  }

  prev() {
    this.stop();
    this.play(Math.max(this.index - 1, 0));
  }

  seekToChunk(index) {
    this.stop();
    this.play(index);
  }
}
