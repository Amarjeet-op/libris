// Lazily builds a Web Audio graph around an existing <audio> element so we
// can sample frequency data for the waveform visualization. Must be created
// after a user gesture (autoplay policy) — call ensureContext() from a click
// handler, not on mount.

export function isWebAudioSupported() {
  return typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
}

export class AudioAnalyser {
  constructor(audioEl) {
    this.audioEl = audioEl;
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.data = null;
  }

  ensureContext() {
    if (this.ctx || this.failed || !isWebAudioSupported()) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      // createMediaElementSource can only ever be called once for a given
      // <audio> element's lifetime — a Fast Refresh (or any remount that
      // resets this instance but reuses the same DOM node) hitting this a
      // second time throws. The waveform is cosmetic, so give up quietly
      // instead of taking playback down with it.
      const source = ctx.createMediaElementSource(this.audioEl);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      this.ctx = ctx;
      this.source = source;
      this.analyser = analyser;
      this.data = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      this.failed = true;
      try {
        this.ctx?.close();
      } catch {}
      this.ctx = null;
      this.source = null;
      this.analyser = null;
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") {
      this.ctx.resume();
    }
  }

  getBars(count = 32) {
    if (!this.analyser || !this.data) return new Array(count).fill(0.08);
    this.analyser.getByteFrequencyData(this.data);
    const step = Math.floor(this.data.length / count) || 1;
    const bars = [];
    for (let i = 0; i < count; i += 1) {
      const value = this.data[i * step] || 0;
      bars.push(Math.max(0.06, value / 255));
    }
    return bars;
  }

  destroy() {
    try {
      this.source?.disconnect();
      this.analyser?.disconnect();
      this.ctx?.close();
    } catch {
      // already closed / never opened
    }
    this.ctx = null;
    this.analyser = null;
    this.source = null;
  }
}
