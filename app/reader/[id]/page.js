"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLibrary, loadBookFile } from "@/context/LibraryContext";
import { DEMO_BOOK_ID, getDemoBook } from "@/lib/demoBook";
import { Reader } from "@/components/reader/Reader";
import { LoadingBook } from "@/components/shared/LoadingBook";

export default function ReaderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { books, hydrated } = useLibrary();

  if (id === DEMO_BOOK_ID) {
    const demo = getDemoBook();
    return <Reader bookId={DEMO_BOOK_ID} title={demo.title} author={demo.author} isDemo />;
  }

  return <RealBookReader id={id} books={books} hydrated={hydrated} router={router} />;
}

function RealBookReader({ id, books, hydrated, router }) {
  const book = books.find((b) => b.id === id);
  const [files, setFiles] = useState(null);

  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    (async () => {
      const [pdfBlob, audioBlob] = await Promise.all([
        book.hasPdf ? loadBookFile(id, "pdf") : Promise.resolve(null),
        book.hasAudio ? loadBookFile(id, "audio") : Promise.resolve(null),
      ]);
      if (!cancelled) setFiles({ pdfBlob, audioBlob });
    })();
    return () => {
      cancelled = true;
    };
  }, [id, book]);

  if (!hydrated) return <LoadingBook status="loading" />;

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-xl italic text-[var(--ink)]">This book isn&apos;t in your library.</p>
        <p className="max-w-sm text-sm text-[var(--ink-faint)]">
          It may have been removed, or the link is incorrect.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--bg)]"
        >
          Back to library
        </button>
      </div>
    );
  }

  if (!files) return <LoadingBook status="loading" />;

  return (
    <Reader
      bookId={id}
      title={book.title}
      author={book.author}
      isDemo={false}
      pdfFile={files.pdfBlob}
      audioFile={files.audioBlob}
    />
  );
}
