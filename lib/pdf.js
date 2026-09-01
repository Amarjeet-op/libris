let pdfjsLib = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  pdfjsLib = lib;
  return lib;
}

export async function loadPdf(source) {
  const lib = await getPdfjs();
  const loadingTask = lib.getDocument(
    typeof source === "string" ? source : { data: source }
  );
  return loadingTask.promise;
}

export async function getPageTextContent(pdfDoc, pageNumber) {
  const page = await pdfDoc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const text = textContent.items.map((item) => item.str).join(" ");
  return text;
}

// Extracts text for every page, batching work across idle callbacks so the
// UI thread stays responsive on large PDFs. Calls onProgress(done, total).
export async function extractAllPageText(pdfDoc, onProgress) {
  const total = pdfDoc.numPages;
  const pageTexts = [];
  for (let i = 1; i <= total; i += 1) {
    const text = await getPageTextContent(pdfDoc, i);
    pageTexts.push({ page: i, text });
    onProgress?.(i, total);
    // yield to the event loop every few pages so scrolling/clicks stay smooth
    if (i % 3 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return pageTexts;
}

export function isLikelyScanned(pageTexts) {
  if (pageTexts.length === 0) return false;
  const sample = pageTexts.slice(0, Math.min(5, pageTexts.length));
  const totalChars = sample.reduce((sum, p) => sum + p.text.trim().length, 0);
  const avgChars = totalChars / sample.length;
  return avgChars < 20;
}

// Composes two PDF affine transforms (same convention as pdf.js's own
// Util.transform): applies m2 in m1's space. Used to map a text item's own
// transform into viewport (CSS pixel) space without depending on an
// internal/undocumented pdfjs export.
function composeTransform(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

// Builds one highlight box per text item, in the same viewport pixel space
// as the rendered canvas, plus the [start,end) character range each item
// occupies in the page's join(" ")-concatenated text — the same join logic
// getPageTextContent/extractAllPageText use, so chunk offsets from
// textChunk.js line up with these boxes without any separate alignment step.
export function computeHighlightBoxes(items, viewport) {
  let offset = 0;
  const boxes = [];
  for (const item of items) {
    const str = item.str || "";
    const start = offset;
    const end = start + str.length;
    if (str.trim()) {
      const tx = composeTransform(viewport.transform, item.transform);
      const fontHeight = Math.hypot(tx[2], tx[3]) || 1;
      const width = Math.max((item.width || 0) * viewport.scale, 2);
      boxes.push({
        start,
        end,
        left: tx[4],
        top: tx[5] - fontHeight,
        width,
        height: fontHeight * 1.25,
      });
    }
    offset = end + 1;
  }
  return boxes;
}

// Same transform/box math as computeHighlightBoxes, but splits each text
// item into words and distributes its pixel width across them proportionally
// to character count. pdf.js's text-extraction API doesn't expose per-glyph
// widths, so this is an approximation — but it tracks real word boundaries
// and line geometry, which is what lets user-driven highlighting snap to
// words instead of brushing an arbitrary rectangle. start/end are in the
// same absolute character-offset space as computeHighlightBoxes, so the two
// box sets can be compared/filtered by the same {start,end} ranges.
export function computeWordBoxes(items, viewport) {
  let offset = 0;
  const boxes = [];
  for (const item of items) {
    const str = item.str || "";
    const itemStart = offset;
    offset = itemStart + str.length + 1;
    if (!str.trim()) continue;

    const tx = composeTransform(viewport.transform, item.transform);
    const fontHeight = Math.hypot(tx[2], tx[3]) || 1;
    const itemWidth = Math.max((item.width || 0) * viewport.scale, 2);
    const itemLeft = tx[4];
    const itemTop = tx[5] - fontHeight;

    const wordRe = /\S+/g;
    let match;
    while ((match = wordRe.exec(str))) {
      const word = match[0];
      const charIndex = match.index;
      boxes.push({
        start: itemStart + charIndex,
        end: itemStart + charIndex + word.length,
        left: itemLeft + (charIndex / str.length) * itemWidth,
        top: itemTop,
        width: Math.max((word.length / str.length) * itemWidth, 2),
        height: fontHeight * 1.25,
      });
    }
  }
  return boxes;
}
