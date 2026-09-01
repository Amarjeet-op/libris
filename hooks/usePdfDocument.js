"use client";

import { useState, useEffect, useRef } from "react";
import { loadPdf, extractAllPageText, isLikelyScanned } from "@/lib/pdf";

// source: a Blob/File, ArrayBuffer, or URL string. Pass null to reset.
export function usePdfDocument(source) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageTexts, setPageTexts] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [status, setStatus] = useState("idle"); // idle | loading | extracting | ready | error
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(false);
  // Native width/height ratio of page 1 — lets the reader shape its page
  // frame to match the real document instead of a generic fixed ratio, so
  // there's no letterboxing gap around the rendered page.
  const [pageAspect, setPageAspect] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setPdfDoc(null);
    setPageCount(0);
    setPageTexts([]);
    setScanned(false);
    setError(null);
    setPageAspect(null);

    if (!source) {
      setStatus("idle");
      return;
    }

    setStatus("loading");

    async function run() {
      try {
        const data = source instanceof Blob ? await source.arrayBuffer() : source;
        const doc = await loadPdf(data);
        if (cancelledRef.current) return;
        setPdfDoc(doc);
        setPageCount(doc.numPages);

        const firstPage = await doc.getPage(1);
        if (cancelledRef.current) return;
        const nativeViewport = firstPage.getViewport({ scale: 1 });
        setPageAspect(nativeViewport.width / nativeViewport.height);

        setStatus("extracting");

        const texts = await extractAllPageText(doc, (done, total) => {
          if (!cancelledRef.current) setProgress({ done, total });
        });
        if (cancelledRef.current) return;
        setPageTexts(texts);
        setScanned(isLikelyScanned(texts));
        setStatus("ready");
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err);
          setStatus("error");
        }
      }
    }

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [source]);

  return { pdfDoc, pageCount, pageTexts, progress, status, error, scanned, pageAspect };
}
