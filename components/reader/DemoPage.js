"use client";

// The built-in demo book has no PDF to render, so its pages are styled text
// using the same typography as a real page. Highlighting works the same way
// as PDFPage: a [start,end) char range into the page's raw text.
export function DemoPage({ text, activeRange = null, fontSize = "base" }) {
  const sizeClass =
    fontSize === "lg" ? "text-[19px] leading-[1.9]" : fontSize === "sm" ? "text-[15px] leading-[1.75]" : "text-[17px] leading-[1.85]";

  if (!activeRange) {
    return <p className={`font-serif text-[var(--ink)] ${sizeClass}`}>{text}</p>;
  }

  const start = Math.max(0, Math.min(activeRange.start, text.length));
  const end = Math.max(start, Math.min(activeRange.end, text.length));

  return (
    <p className={`font-serif text-[var(--ink)] ${sizeClass}`}>
      {text.slice(0, start)}
      <span className="speech-highlight">{text.slice(start, end)}</span>
      {text.slice(end)}
    </p>
  );
}
