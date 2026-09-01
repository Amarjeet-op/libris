"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  SpeechController,
  isSpeechSupported,
  getVoices,
  pickDefaultVoice,
} from "@/lib/speech";

export function useSpeech({ chunks, onChunkChange, rate, pitch, volume, voiceName }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(isSpeechSupported());
  }, []);
  const controllerRef = useRef(null);
  const onChunkChangeRef = useRef(onChunkChange);
  onChunkChangeRef.current = onChunkChange;
  const [voices, setVoices] = useState([]);
  const [speechState, setSpeechState] = useState("idle");
  const [chunkIndex, setChunkIndex] = useState(-1);

  if (!controllerRef.current && supported) {
    controllerRef.current = new SpeechController({
      onChunkStart: (chunk, index) => {
        setChunkIndex(index);
        onChunkChangeRef.current?.(chunk, index);
      },
      onStateChange: setSpeechState,
    });
  }

  useEffect(() => {
    if (!supported) return;
    function refreshVoices() {
      setVoices(getVoices());
    }
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, [supported]);

  useEffect(() => {
    controllerRef.current?.load(chunks || []);
    setChunkIndex(-1);
  }, [chunks]);

  useEffect(() => {
    if (!controllerRef.current) return;
    const chosen = voiceName
      ? voices.find((v) => v.name === voiceName)
      : pickDefaultVoice(voices);
    controllerRef.current.setVoice(chosen || null);
  }, [voiceName, voices]);

  useEffect(() => {
    controllerRef.current?.setRate(rate ?? 1);
  }, [rate]);

  useEffect(() => {
    controllerRef.current?.setPitch(pitch ?? 1);
  }, [pitch]);

  useEffect(() => {
    controllerRef.current?.setVolume(volume ?? 1);
  }, [volume]);

  useEffect(() => {
    return () => controllerRef.current?.stop();
  }, []);

  const play = useCallback((startIndex) => {
    controllerRef.current?.play(startIndex ?? Math.max(0, chunkIndex));
  }, [chunkIndex]);

  const pause = useCallback(() => controllerRef.current?.pause(), []);
  const resume = useCallback(() => controllerRef.current?.resume(), []);
  const stop = useCallback(() => controllerRef.current?.stop(), []);
  const next = useCallback(() => controllerRef.current?.next(), []);
  const prev = useCallback(() => controllerRef.current?.prev(), []);
  const seekToChunk = useCallback((index) => controllerRef.current?.seekToChunk(index), []);

  return {
    supported,
    voices,
    speechState,
    chunkIndex,
    play,
    pause,
    resume,
    stop,
    next,
    prev,
    seekToChunk,
  };
}
