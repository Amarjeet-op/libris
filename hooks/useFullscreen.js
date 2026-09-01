"use client";

import { useState, useEffect, useCallback } from "react";

export function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const enter = useCallback(async () => {
    const el = targetRef?.current || document.documentElement;
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen();
      } catch {
        // user gesture requirement not met, or unsupported — ignore
      }
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
