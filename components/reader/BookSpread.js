"use client";

import { createContext, forwardRef, useContext, useEffect, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { PDFPage } from "./PDFPage";
import { DemoPage } from "./DemoPage";

// Only mount real PDF canvases / demo text for pages near the one showing —
// react-pageflip wants every page mounted as a child up front, and mounting
// every page's <canvas> at once would be a real perf hit on large PDFs.
const LAZY_WINDOW = 2;
const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 850;
// react-pageflip's "stretch" sizing reads this element's own offsetHeight to
// decide how much to shrink pages by — without an explicit height here it
// has no bounded height to measure against and overflows its container.
const FLIP_STYLE = { width: "100%", height: "100%" };

// react-pageflip only re-reads its `children` prop when the *reference*
// changes, and rebuilds its whole page collection (updateFromHtml) whenever
// it does — which stomps any flip animation in progress. So the elements
// passed to <HTMLFlipBook> are memoized and never change identity across
// navigation; live values (currentPage, activeChunk, ...) reach each page
// through this context instead of through props.
const PageDataContext = createContext(null);

function PageLeaf({ pageNumber }) {
  const {
    pageCount,
    isDemo,
    pdfDoc,
    demoPageTexts,
    activeChunk,
    fontSize,
    highlightMode,
    eraseMode,
    highlights,
    onAddHighlight,
    onRemoveHighlight,
  } = useContext(PageDataContext);
  const pageHighlights = highlights?.[pageNumber] || [];
  const inRange = pageNumber >= 1 && pageNumber <= pageCount;
  const activeRange =
    activeChunk && activeChunk.page === pageNumber
      ? { start: activeChunk.start, end: activeChunk.end }
      : null;

  const contentRef = useRef(null);
  // Start with a sensible default so first paint isn't "small pulse -> big page" zoom.
  const [box, setBox] = useState({ width: 780, height: 1050 });

  useEffect(() => {
    if (isDemo) return;
    const el = contentRef.current;
    if (!el) return;
    let frame = null;
    const update = () => {
      const width = Math.round(el.clientWidth);
      const height = Math.round(el.clientHeight);
      if (width < 40 || height < 40) return; // ignore collapsed initial measure
      setBox((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    };
    update();
    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isDemo]);

  return (
    <div className="paper-texture relative flex h-full w-full overflow-hidden shadow-[0_2px_18px_rgba(0,0,0,0.18),0_8px_36px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
      <div
        ref={contentRef}
        className={`flex h-full w-full items-center justify-center overflow-hidden ${
          isDemo ? "px-4 py-6 sm:px-7 sm:py-8" : ""
        }`}
      >
        {!inRange ? null : isDemo ? (
          <DemoPage
            text={demoPageTexts.find((p) => p.page === pageNumber)?.text || ""}
            activeRange={activeRange}
            fontSize={fontSize}
          />
        ) : (
          <PDFPage
            pdfDoc={pdfDoc}
            pageNumber={pageNumber}
            activeRange={activeRange}
            boxWidth={box?.width}
            boxHeight={box?.height}
            highlightMode={highlightMode}
            eraseMode={eraseMode}
            highlights={pageHighlights}
            onAddHighlight={(data) => onAddHighlight?.(pageNumber, data)}
            onRemoveHighlight={(id) => onRemoveHighlight?.(pageNumber, id)}
          />
        )}
      </div>
      {inRange && (
        // Absolutely positioned so the page number never eats into contentRef's
        // measured box — PDFPage fits its canvas to that box's exact aspect
        // ratio, and a footer in normal flow was shrinking its height and
        // reintroducing a top/bottom letterbox gap.
        <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-sans text-[11px] tracking-wide text-[var(--ink-faint)]">
          {pageNumber}
        </div>
      )}
    </div>
  );
}

// react-pageflip clones each child with a `ref` callback so it can read the
// real DOM node for `loadFromHTML` — a plain function component can't take
// a ref, so this must be forwardRef'd or the library silently never inits.
const LazyPage = forwardRef(function LazyPage({ pageNumber }, ref) {
  const { currentPage } = useContext(PageDataContext);
  const near = Math.abs(pageNumber - currentPage) <= LAZY_WINDOW;
  return (
    <div ref={ref} className="page h-full w-full">
      {near ? <PageLeaf pageNumber={pageNumber} /> : <div className="paper-texture h-full w-full" />}
    </div>
  );
});

export function BookSpread({
  flipRef,
  currentPage,
  pageCount,
  isDemo,
  pdfDoc,
  pageAspect,
  demoPageTexts,
  activeChunk,
  fontSize,
  pageLayout,
  reduceMotion,
  zoom = 1,
  onFlip,
  highlightMode,
  eraseMode,
  highlights,
  onAddHighlight,
  onRemoveHighlight,
}) {
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canPan = zoom > 1;

  useEffect(() => {
    if (!canPan) setPan({ x: 0, y: 0 });
  }, [canPan, zoom]);

  // Trackpad/mouse-wheel panning, alongside (not instead of) the drag-to-pan
  // below — both should move a zoomed page. Attached natively rather than via
  // React's onWheel, which React makes passive by default and can't
  // preventDefault; without that, the scroll would also try to scroll the
  // outer page underneath. Ctrl+wheel is left alone — Reader.js's own
  // listener on an ancestor handles that as zoom instead.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !canPan) return;
    function onWheel(e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canPan]);

  function onPointerDown(e) {
    if (!canPan || highlightMode || eraseMode || e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPan: { ...pan } };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.startPan.x + dx, y: dragRef.current.startPan.y + dy });
  }

  function endDrag(e) {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}
  }

  // Only remount the flipbook when the underlying document changes — page
  // layout (single/double) is handled by resizing its container, which
  // react-pageflip's own orientation logic reacts to live, no remount needed.
  const docKey = isDemo ? "demo" : pdfDoc ? "pdf" : "none";

  // The demo book has no real document to measure, so it keeps the generic
  // fixed shape. Real PDFs report their true page aspect once loaded (see
  // usePdfDocument.js) — deriving height from it here instead of using the
  // fixed PAGE_HEIGHT is what stops the top/bottom letterbox gap that shows
  // for documents whose native shape doesn't match the generic ratio.
  const pageWidth = PAGE_WIDTH;
  const pageHeight = pageAspect ? Math.round(PAGE_WIDTH / pageAspect) : PAGE_HEIGHT;

  // react-pageflip needs a couple of its own render cycles after mount before
  // `pageFlip()` returns a working instance (it bootstraps children -> internal
  // "pages" state -> PageFlip construction -> loadFromHTML, each a separate
  // effect). Calling `.turnToPage()` in an effect here used to race that
  // bootstrap: on the very first mount the instance almost never existed yet,
  // so the call silently never happened — the book always opened on page 1
  // (looking like a black flash while nothing had rendered yet, then a
  // "reset to the start" once react-pageflip did finish loading) and any
  // saved reading position was ignored. Passing `startPage` instead tells
  // react-pageflip which page to open on *before* it does that first render,
  // so the correct page is there from the first frame with no jump.
  const startPage = useMemo(
    () => Math.max(0, (currentPage || 1) - 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docKey]
  );

  // page-flip only recalculates its landscape/portrait orientation on a
  // window resize event — toggling pageLayout just resizes our own wrapper
  // div, so nudge it to recheck against the new container width directly.
  useEffect(() => {
    flipRef?.current?.pageFlip?.()?.getRender()?.update();
  }, [pageLayout]);

  // Memoized on structural deps only, so its reference stays stable across
  // ordinary navigation — see the PageDataContext comment above for why that
  // matters. Live per-render values flow through the context instead.
  const pageElements = useMemo(
    () => Array.from({ length: pageCount || 0 }, (_, i) => i + 1).map((num) => <LazyPage key={num} pageNumber={num} />),
    [pageCount, docKey]
  );

  const contextValue = useMemo(
    () => ({
      currentPage,
      pageCount,
      isDemo,
      pdfDoc,
      demoPageTexts,
      activeChunk,
      fontSize,
      highlightMode,
      eraseMode,
      highlights,
      onAddHighlight,
      onRemoveHighlight,
    }),
    [
      currentPage,
      pageCount,
      isDemo,
      pdfDoc,
      demoPageTexts,
      activeChunk,
      fontSize,
      highlightMode,
      eraseMode,
      highlights,
      onAddHighlight,
      onRemoveHighlight,
    ]
  );

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`flex h-full w-full touch-none items-center justify-center overflow-hidden bg-[var(--bg)] ${
        highlightMode
          ? "cursor-highlighter"
          : eraseMode
            ? "cursor-eraser"
            : canPan
              ? dragging
                ? "cursor-grabbing select-none"
                : "cursor-grab"
              : ""
      }`}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: pageLayout === "single" ? pageWidth : pageWidth * 2,
          maxWidth: "100%",
          height: "100%",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: dragging ? "none" : "transform 150ms ease-out",
        }}
      >
        <PageDataContext.Provider value={contextValue}>
          <HTMLFlipBook
            key={docKey}
            ref={flipRef}
            width={pageWidth}
            height={pageHeight}
            size="stretch"
            startPage={startPage}
            // usePortrait switches to a single visible page when the container is
            // narrower than 2*minWidth — pick a value between the single-layout
            // container width (pageWidth) and the double-layout one (pageWidth*2)
            // so single-layout always lands in portrait and double always in landscape.
            minWidth={pageWidth * 0.75}
            maxWidth={900}
            minHeight={pageHeight * 0.5}
            maxHeight={1200}
            showCover={false}
            usePortrait
            drawShadow={false}
            showPageCorners={false}
            flippingTime={reduceMotion ? 0 : 620}
            mobileScrollSupport={false}
            onFlip={onFlip}
            className="book-flip"
            style={FLIP_STYLE}
          >
            {pageElements}
          </HTMLFlipBook>
        </PageDataContext.Provider>
      </div>
    </div>
  );
}
