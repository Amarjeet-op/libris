"use client";

import { useEffect, useRef, useState } from "react";

// While `active`, starts hidden-after-idle: visible right away, then false
// once `timeoutMs` passes with no mouse/touch/key activity, reset on any of
// those. While inactive, stays visible permanently (no auto-hide outside it).
export function useIdleVisibility(active, timeoutMs = 2600) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) {
      clearTimeout(timerRef.current);
      setVisible(true);
      return;
    }

    setVisible(true);

    function scheduleHide() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), timeoutMs);
    }

    function onActivity() {
      setVisible(true);
      scheduleHide();
    }

    scheduleHide();
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("touchstart", onActivity);
    window.addEventListener("keydown", onActivity);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [active, timeoutMs]);

  return visible;
}
