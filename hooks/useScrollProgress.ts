'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface ScrollProgressContextValue {
  progress: number;
  velocityY: number;
  subscribe: (listener: () => void) => () => void;
}

let scrollListeners = new Set<() => void>();
let lastProgress = 0;
let lastVelocityY = 0;

function updateScrollProgress() {
  if (typeof window === 'undefined') return;

  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = window.scrollY;
  const newProgress = scrollHeight > 0 ? scrolled / scrollHeight : 0;

  const newVelocityY = (newProgress - lastProgress) * 100;

  lastProgress = newProgress;
  lastVelocityY = newVelocityY;

  scrollListeners.forEach((listener) => listener());
}

function subscribeToScroll(listener: () => void) {
  scrollListeners.add(listener);
  return () => scrollListeners.delete(listener);
}

export function useScrollProgress(): ScrollProgressContextValue {
  const prefersReduced = useReducedMotion();
  const [, setTick] = useState(0);
  const progressRef = useRef(lastProgress);
  const velocityRef = useRef(lastVelocityY);

  useEffect(() => {
    if (prefersReduced) return;

    const unsubscribe = subscribeToScroll(() => {
      progressRef.current = lastProgress;
      velocityRef.current = lastVelocityY;
      setTick((prev) => prev + 1);
    });

    const handleScroll = () => updateScrollProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, [prefersReduced]);

  return {
    progress: progressRef.current,
    velocityY: velocityRef.current,
    subscribe: subscribeToScroll,
  };
}

export function getScrollProgress(): number {
  return lastProgress;
}

export function subscribeToScrollProgress(
  listener: (progress: number) => void,
): () => void {
  const wrappedListener = () => listener(lastProgress);
  return subscribeToScroll(wrappedListener);
}
