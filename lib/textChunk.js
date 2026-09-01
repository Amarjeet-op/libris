// Practical, sentence-level chunking. Browser speech synthesis and PDF.js text
// extraction do not give reliable word-level boundaries, so we deliberately
// sync at sentence granularity — see the plan notes for why.
//
// IMPORTANT: start/end offsets are indices into the RAW page text exactly as
// produced by getPageTextContent (items joined with a single space, no
// whitespace collapsing). That's the same string computeHighlightBoxes()
// walks item-by-item, so a chunk's [start,end) lines up with the text-layer
// boxes used for the reading highlight without any extra alignment step.

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "e.g", "i.e",
]);

function splitSentences(rawText) {
  if (!rawText) return [];

  const sentences = [];
  let start = 0;
  const boundary = /[.!?]+["')\]]?\s+/g;
  let match;

  while ((match = boundary.exec(rawText))) {
    const end = match.index + match[0].length;
    const slice = rawText.slice(start, end);
    const trimmed = slice.trim();
    const beforePeriod = rawText
      .slice(Math.max(0, match.index - 4), match.index)
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    if (trimmed && trimmed.length > 1 && !ABBREVIATIONS.has(beforePeriod)) {
      sentences.push({ text: trimmed.replace(/\s+/g, " "), start, end });
      start = end;
    }
  }

  if (start < rawText.length) {
    const rest = rawText.slice(start);
    const trimmed = rest.trim();
    if (trimmed) {
      sentences.push({ text: trimmed.replace(/\s+/g, " "), start, end: rawText.length });
    }
  }

  return sentences;
}

// Very long sentences (rare — PDFs occasionally lack punctuation) are split
// further for responsive speech, but keep the ORIGINAL sentence's offsets so
// the highlight still lands on the whole sentence rather than drifting.
const MAX_CHUNK_LEN = 240;

function capLength(sentence) {
  if (sentence.text.length <= MAX_CHUNK_LEN) return [sentence];
  const words = sentence.text.split(" ");
  const parts = [];
  let buf = [];
  let len = 0;
  for (const w of words) {
    if (len + w.length + 1 > MAX_CHUNK_LEN && buf.length) {
      parts.push(buf.join(" "));
      buf = [];
      len = 0;
    }
    buf.push(w);
    len += w.length + 1;
  }
  if (buf.length) parts.push(buf.join(" "));
  return parts.map((text) => ({ text, start: sentence.start, end: sentence.end }));
}

// pageTexts: [{ page, text }] -> flat array of { id, page, text, start, end }
export function buildSpeechChunks(pageTexts) {
  const chunks = [];
  let id = 0;
  for (const { page, text } of pageTexts) {
    const sentences = splitSentences(text);
    for (const sentence of sentences) {
      for (const piece of capLength(sentence)) {
        if (piece.text.trim()) {
          chunks.push({ id: id++, page, text: piece.text.trim(), start: piece.start, end: piece.end });
        }
      }
    }
  }
  return chunks;
}
