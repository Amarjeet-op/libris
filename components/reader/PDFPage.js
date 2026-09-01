"use client";

import { useEffect, useRef, useState } from "react";
import { computeHighlightBoxes, computeWordBoxes } from "@/lib/pdf";

// Renders one PDF page to a canvas, lazily, with a transparent overlay of
// highlight boxes for the currently-speaking sentence (see lib/pdf.js for
// how those boxes are computed to line up with textChunk.js offsets), plus
// (when highlightMode is on) a drag-to-select overlay that snaps to real
// words and persists the resulting ranges as `highlights`, or (when
// eraseMode is on) a drag-to-erase overlay that removes any highlight it
// passes over. When a page has no recognizable text nearby (e.g. a scanned
// page with no extractable text layer, or a picture/diagram region), word
// snapping has nothing to snap to — dragging then falls back to a plain
// freeform rectangle highlight instead of silently doing nothing.
const SNAP_MAX_DIST = 48;
export function PDFPage({
  pdfDoc,
  pageNumber,
  activeRange = null,
  boxWidth,
  boxHeight,
  highlightMode = false,
  eraseMode = false,
  highlights = [],
  onAddHighlight,
  onRemoveHighlight,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const dragStateRef = useRef(null);
  const [size, setSize] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [wordBoxes, setWordBoxes] = useState([]);
  const [pendingRange, setPendingRange] = useState(null);
  const [pendingRect, setPendingRect] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastPageRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !pageNumber || !boxWidth) return;
    // boxHeight may be missing in free (non-fullscreen) mode — fit to width only.
    const effectiveBoxHeight = boxHeight && boxHeight > 120 ? boxHeight : null;
    let cancelled = false;
    let renderTask = null;
    const isNewPage = lastPageRef.current !== pageNumber;
    lastPageRef.current = pageNumber;
    if (isNewPage) {
      setLoading(true);
      setPendingRange(null);
      setPendingRect(null);
      dragStateRef.current = null;
    }

    async function run() {
      const page = await pdfDoc.getPage(pageNumber);
      if (cancelled) return;
      const nativeViewport = page.getViewport({ scale: 1 });
      const widthScale = boxWidth / nativeViewport.width;
      const heightScale = effectiveBoxHeight ? effectiveBoxHeight / nativeViewport.height : Infinity;
      const fitScale = Math.min(widthScale, heightScale);
      if (!Number.isFinite(fitScale) || fitScale <= 0) return;
      const viewport = page.getViewport({ scale: fitScale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      const outputScale = Math.min((window.devicePixelRatio || 1) * 2.5, 4);

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      renderTask = page.render({ canvasContext: context, viewport, transform });
      await renderTask.promise;
      if (cancelled) return;

      setSize({ width: viewport.width, height: viewport.height });

      const textContent = await page.getTextContent();
      if (cancelled) return;
      setBoxes(computeHighlightBoxes(textContent.items, viewport));
      setWordBoxes(computeWordBoxes(textContent.items, viewport));
      setLoading(false);
    }

    run().catch((err) => {
      if (err?.name !== "RenderingCancelledException" && !cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNumber, boxWidth, boxHeight]);

  useEffect(() => {
    if (!highlightMode && !eraseMode) {
      setPendingRange(null);
      setPendingRect(null);
      dragStateRef.current = null;
    }
  }, [highlightMode, eraseMode]);

  const activeBoxes = activeRange
    ? boxes.filter((b) => b.start < activeRange.end && b.end > activeRange.start)
    : [];

  function localPoint(e) {
    const rect = overlayRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // Snap a pointer position to the nearest word box: a direct hit if the
  // point actually falls inside one, otherwise the closest by edge distance
  // (so dragging slightly above/below a line of text still tracks that
  // line's nearest word instead of matching nothing). Returns the distance
  // alongside the box so callers can tell "close enough to snap to" apart
  // from "nothing recognizable anywhere near this point" (see SNAP_MAX_DIST).
  function nearestWordBox(point) {
    let best = null;
    let bestDist = Infinity;
    for (const b of wordBoxes) {
      const dx = Math.max(b.left - point.x, 0, point.x - (b.left + b.width));
      const dy = Math.max(b.top - point.y, 0, point.y - (b.top + b.height));
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return { box: b, dist: 0 };
      if (dist < bestDist) {
        bestDist = dist;
        best = b;
      }
    }
    return best ? { box: best, dist: bestDist } : null;
  }

  // The word-snapped match, or null if there's nothing recognizable close
  // enough to the point to trust (an unrecognized/scanned page, or a
  // picture/diagram region with no nearby text).
  function snappedWordBox(point) {
    const found = nearestWordBox(point);
    return found && found.dist <= SNAP_MAX_DIST ? found.box : null;
  }

  // Any highlight whose rendered boxes contain this point gets removed —
  // used both by a plain click in highlight mode and by every point the
  // eraser passes over while dragging. Handles both word-snapped highlights
  // (start/end character offsets, hit-tested against `boxes`) and manual
  // freeform ones (a `rect` stored as fractions of the page size).
  function eraseAt(point) {
    for (const h of highlights) {
      const hit = h.rect
        ? size &&
          point.x >= h.rect.left * size.width &&
          point.x <= (h.rect.left + h.rect.width) * size.width &&
          point.y >= h.rect.top * size.height &&
          point.y <= (h.rect.top + h.rect.height) * size.height
        : boxes.some(
            (b) =>
              b.start < h.end &&
              b.end > h.start &&
              point.x >= b.left &&
              point.x <= b.left + b.width &&
              point.y >= b.top &&
              point.y <= b.top + b.height
          );
      if (hit) onRemoveHighlight?.(h.id);
    }
  }

  // stopPropagation/preventDefault here keep this drag from also reaching
  // react-pageflip's own mousedown/touchstart listener (it's bound on an
  // ancestor of this overlay and starts a page-turn on *any* press unless
  // the event never bubbles that far) — otherwise selecting or erasing text
  // also flips the page underneath it.
  function handlePointerDown(e) {
    if (!highlightMode && !eraseMode) return;
    e.preventDefault();
    e.stopPropagation();
    const point = localPoint(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (eraseMode) {
      dragStateRef.current = { mode: "erase" };
      eraseAt(point);
      return;
    }
    const anchor = snappedWordBox(point);
    if (anchor) {
      dragStateRef.current = { mode: "mark", startX: e.clientX, startY: e.clientY, anchor, moved: false };
      setPendingRange({ start: anchor.start, end: anchor.end });
      return;
    }
    // Nothing recognizable to snap to here — fall back to a plain freeform
    // rectangle so highlighting still works on scanned/unrecognized pages.
    dragStateRef.current = { mode: "manual", startX: point.x, startY: point.y, moved: false };
    setPendingRect({ left: point.x, top: point.y, width: 0, height: 0 });
  }

  function handlePointerMove(e) {
    e.stopPropagation();
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.mode === "erase") {
      eraseAt(localPoint(e));
      return;
    }
    if (drag.mode === "manual") {
      const point = localPoint(e);
      if (!drag.moved && Math.hypot(point.x - drag.startX, point.y - drag.startY) > 4) drag.moved = true;
      setPendingRect({
        left: Math.min(drag.startX, point.x),
        top: Math.min(drag.startY, point.y),
        width: Math.abs(point.x - drag.startX),
        height: Math.abs(point.y - drag.startY),
      });
      return;
    }
    if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) drag.moved = true;
    const current = snappedWordBox(localPoint(e));
    if (!current) return;
    setPendingRange({
      start: Math.min(drag.anchor.start, current.start),
      end: Math.max(drag.anchor.end, current.end),
    });
  }

  function handlePointerUp(e) {
    e.stopPropagation();
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    if (!drag) return;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}

    if (drag.mode === "erase") return;

    if (drag.mode === "manual") {
      if (drag.moved && pendingRect && pendingRect.width > 4 && pendingRect.height > 4 && size) {
        onAddHighlight?.({
          rect: {
            left: pendingRect.left / size.width,
            top: pendingRect.top / size.height,
            width: pendingRect.width / size.width,
            height: pendingRect.height / size.height,
          },
        });
      } else if (!drag.moved) {
        eraseAt(localPoint(e));
      }
      setPendingRect(null);
      return;
    }

    if (!drag.moved) {
      // A click, not a drag — toggle off an existing highlight under it.
      eraseAt(localPoint(e));
      setPendingRange(null);
      return;
    }

    if (pendingRange && pendingRange.end > pendingRange.start) {
      onAddHighlight?.({ start: pendingRange.start, end: pendingRange.end });
    }
    setPendingRange(null);
  }

  const pendingBoxes = pendingRange
    ? wordBoxes.filter((b) => b.start < pendingRange.end && b.end > pendingRange.start)
    : [];

  // Prevent "small → big zoom" on page change: keep container size stable
  // while the new page renders. Use box dimensions for placeholder, then
  // lock to rendered `size` once available.
  const placeholderStyle = !size && boxWidth ? { width: boxWidth, height: Math.round(boxWidth * 1.414) } : undefined;
  const containerStyle = size ? { width: size.width, height: size.height } : placeholderStyle;

  return (
    <div className="relative mx-auto" style={containerStyle}>
      {loading && (
        <div className="absolute inset-0 animate-pulse rounded-sm bg-[var(--border)]" style={size ? undefined : { minHeight: 300 }} />
      )}
      <canvas ref={canvasRef} className="block rounded-[2px] opacity-0 data-[ready=true]:opacity-100 transition-opacity duration-150" data-ready={!!size} />
      {size && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {activeBoxes.map((b, i) => (
            <div
              key={i}
              className="speech-highlight absolute"
              style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
            />
          ))}
          {highlights.map((h) =>
            h.rect ? (
              <div
                key={h.id}
                data-highlight-id={h.id}
                className="user-highlight absolute"
                style={{
                  left: h.rect.left * size.width,
                  top: h.rect.top * size.height,
                  width: h.rect.width * size.width,
                  height: h.rect.height * size.height,
                }}
              />
            ) : (
              boxes
                .filter((b) => b.start < h.end && b.end > h.start)
                .map((b, i) => (
                  <div
                    key={`${h.id}-${i}`}
                    data-highlight-id={h.id}
                    className="user-highlight absolute"
                    style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
                  />
                ))
            )
          )}
          {pendingBoxes.map((b, i) => (
            <div
              key={`pending-${i}`}
              className="user-highlight user-highlight-pending absolute"
              style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
            />
          ))}
          {pendingRect && (
            <div
              className="user-highlight user-highlight-pending absolute"
              style={{ left: pendingRect.left, top: pendingRect.top, width: pendingRect.width, height: pendingRect.height }}
            />
          )}
        </div>
      )}
      {size && (highlightMode || eraseMode) && (
        <div
          ref={overlayRef}
          className={`absolute inset-0 ${highlightMode ? "cursor-highlighter" : "cursor-eraser"}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
