"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AudioAnalyser } from "@/lib/audioAnalyser";

export function useAudioPlayer(src) {
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [rate, setRateState] = useState(1);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setError(null);
    setReady(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [src]);

  // Keep the underlying <audio> element in sync when src changes — React's
  // `src` attribute alone isn't always enough to trigger a reload after a
  // previous error or revoked blob URL. Explicit load() ensures metadata fires.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (src) {
      // Avoid re-assigning the same URL which would restart loading.
      const current = audio.currentSrc || audio.src;
      if (current !== src) {
        audio.src = src;
        audio.load();
      }
      audio.volume = volume;
      audio.playbackRate = rate;
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      // For huge MP3s duration may be Infinity/0 until more data buffered — still mark ready
      // as soon as we have any duration or canplay fires.
      setDuration(d);
      if (d > 0 || audio.readyState >= 1) setReady(true);
      setError(null);
    };
    const onCanPlay = () => {
      setReady(true);
      setError(null);
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (d > 0) setDuration(d);
    };
    const onWaiting = () => {
      // Large 500MB files buffer slowly — keep ready true once we ever became ready
      if (audio.readyState >= 2) setReady(true);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      const code = audio.error?.code;
      const msg = audio.error?.message ? ` (${audio.error.message})` : "";
      // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED — common for large blob if MIME was wrong
      if (code === 4) setError("This audio format isn't supported by your browser. Try MP3 or WAV." + msg);
      else if (code) setError("Audio failed to load (error " + code + "). Try another file." + msg);
      else setError("This audio format isn't supported by your browser." + msg);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // If metadata already available (cached blob), fire immediately
    if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
      onLoaded();
    }

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  useEffect(() => {
    return () => {
      analyserRef.current?.destroy();
      analyserRef.current = null;
    };
  }, [src]);

  const ensureAnalyser = useCallback(() => {
    if (!audioRef.current) return null;
    if (!analyserRef.current) {
      analyserRef.current = new AudioAnalyser(audioRef.current);
    }
    analyserRef.current.ensureContext();
    analyserRef.current.resume();
    return analyserRef.current;
  }, []);

  const play = useCallback(() => {
    // The waveform visualizer is cosmetic — never let it block real playback.
    try {
      ensureAnalyser();
    } catch {}
    audioRef.current?.play().catch(() => setError("Playback couldn't start."));
  }, [ensureAnalyser]);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    if (!audioRef.current) return;
    const d = Number.isFinite(audioRef.current.duration)
      ? audioRef.current.duration
      : duration;
    const max = Number.isFinite(d) && d > 0 ? d : time;
    audioRef.current.currentTime = Math.max(0, Math.min(time, max));
    setCurrentTime(audioRef.current.currentTime);
  }, [duration]);

  const skip = useCallback((delta) => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    seek(cur + delta);
  }, [seek]);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const setRate = useCallback((r) => {
    setRateState(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  const getBars = useCallback((count) => analyserRef.current?.getBars(count) ?? new Array(count || 32).fill(0.08), []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    rate,
    error,
    ready,
    play,
    pause,
    toggle,
    seek,
    skip,
    setVolume,
    setRate,
    getBars,
  };
}
