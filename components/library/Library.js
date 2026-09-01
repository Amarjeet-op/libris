"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Headphones } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { getBookState } from "@/lib/storage";
import { isPdfFile, isAudioFile } from "@/lib/fileType";
import { DEMO_BOOK_ID } from "@/lib/demoBook";
import { TopNav } from "@/components/shared/TopNav";
import { UploadZone } from "@/components/landing/UploadZone";
import { BookCard } from "@/components/library/BookCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export function Library() {
  const router = useRouter();
  const { books, addBook, removeBook } = useLibrary();
  const [section, setSection] = useState("library");
  const [pendingRemove, setPendingRemove] = useState(null);

  const continueBook = useMemo(() => {
    const withState = books
      .map((b) => ({ book: b, state: getBookState(b.id) }))
      .filter((x) => x.state.lastOpenedAt)
      .sort((a, b) => b.state.lastOpenedAt - a.state.lastOpenedAt);
    return withState[0]?.book || null;
  }, [books]);

  const visibleBooks = section === "audiobooks" ? books.filter((b) => b.hasAudio) : books;

  const handleFiles = useCallback(
    async (files) => {
      const pdfs = files.filter(isPdfFile);
      const audios = files.filter(isAudioFile);

      if (pdfs.length === 1 && audios.length === 1) {
        const id = await addBook({ pdfFile: pdfs[0], audioFile: audios[0] });
        router.push(`/reader/${id}`);
        return;
      }

      let lastId = null;
      for (const pdf of pdfs) {
        // eslint-disable-next-line no-await-in-loop
        lastId = await addBook({ pdfFile: pdf });
      }
      for (const audio of audios) {
        // eslint-disable-next-line no-await-in-loop
        lastId = await addBook({ audioFile: audio });
      }
      if (lastId && pdfs.length + audios.length === 1) {
        router.push(`/reader/${lastId}`);
      }
    },
    [addBook, router]
  );

  if (books.length === 0) {
    return (
      <div className="min-h-screen">
        <TopNav section={section} onSection={setSection} continueBook={null} />
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-10 text-center sm:pt-16">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-5xl italic leading-[1.05] text-[var(--ink)] sm:text-6xl"
          >
            Your books,
            <br />
            now alive.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]"
          >
            Read your books like books. Listen to them like audiobooks — entirely on your device.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-10 w-full"
          >
            <UploadZone onFiles={handleFiles} />
          </motion.div>

          <button
            type="button"
            onClick={() => router.push(`/reader/${DEMO_BOOK_ID}`)}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-soft)] underline-offset-4 hover:underline"
          >
            <Sparkles size={14} strokeWidth={2} />
            Try the demo
          </button>

          <p className="mt-10 text-xs text-[var(--ink-faint)]">
            No uploads. No accounts. No subscriptions. Your books stay on this device.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav
        section={section}
        onSection={setSection}
        continueBook={continueBook}
        onContinue={() => continueBook && router.push(`/reader/${continueBook.id}`)}
      />

      <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-4">
          <div>
            <h1 className="font-serif text-3xl italic text-[var(--ink)]">Your Library</h1>
            <p className="mt-1 text-sm text-[var(--ink-faint)]">
              Everything you love to read, in one place.
            </p>
          </div>
          <UploadZone onFiles={handleFiles} compact />
        </div>

        {visibleBooks.length === 0 ? (
          <EmptyState
            icon={Headphones}
            title="No audiobooks yet"
            subtitle="Books with narration or an uploaded audiobook will appear here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleBooks.map((book) => (
              <BookCard key={book.id} book={book} onRemove={setPendingRemove} />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title="Remove this book?"
        message="This removes it from your library on this device. This can't be undone."
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          removeBook(pendingRemove);
          setPendingRemove(null);
        }}
      />
    </div>
  );
}
