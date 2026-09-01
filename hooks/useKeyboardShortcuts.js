"use client";

import { useEffect, useRef } from "react";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

// handlers: { next, prev, playPause, volumeUp, volumeDown, zoomIn, zoomOut, zoomReset, fullscreen, bookmark, lock, highlight, erase, escape }
// Kept in a ref so the listener attaches once and always calls the latest
// handlers — works no matter which element currently has focus (a button
// clicked a moment ago, the document body, etc.), short of a real text field.
export function useKeyboardShortcuts(handlers, enabled = true) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e) {
      const target = e.target;
      if (target && (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable)) return;

      const h = handlersRef.current;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          h.next?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          h.prev?.();
          break;
        case "ArrowUp":
          e.preventDefault();
          h.volumeUp?.();
          break;
        case "ArrowDown":
          e.preventDefault();
          h.volumeDown?.();
          break;
        case " ":
          e.preventDefault();
          h.playPause?.();
          break;
        case "+":
        case "=":
          e.preventDefault();
          h.zoomIn?.();
          break;
        case "-":
        case "_":
          e.preventDefault();
          h.zoomOut?.();
          break;
        case "0":
          h.zoomReset?.();
          break;
        case "f":
        case "F":
          h.fullscreen?.();
          break;
        case "b":
        case "B":
          h.bookmark?.();
          break;
        case "d":
        case "D":
          h.lock?.();
          break;
        case "h":
        case "H":
          h.highlight?.();
          break;
        case "e":
        case "E":
          h.erase?.();
          break;
        case "Escape":
          h.escape?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
