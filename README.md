# Libris — Read it. Hear it. Live inside it.

> Turns your PDFs into a beautiful reading and listening experience — entirely on your device. No uploads, no accounts, no subscriptions.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8)

Live demo: try the built-in demo book — no file needed.

---

## Features

### Library
- **Local-first** — books stored in IndexedDB (`lib/db.js`), metadata & progress in `localStorage` (`lib/storage.js`), never uploaded
- **Drag & drop upload** — PDFs + audio files (`.mp3,.wav,.m4a,.aac,.ogg,.webm`), paired in one drop or added individually (`components/landing/UploadZone.js`, `lib/fileType.js`)
- **Grid + filters** — all books / audiobooks, `BookCard` with progress, continue-reading
- **Demo book** — `lib/demoBook.js` for first-run experience

### Reader (`/reader/[id]`)
- **BookSpread flipbook** — `react-pageflip` with single/double page layout, responsive via `useMediaQuery`, `useReducedMotion`
- **PDF rendering** — `pdfjs-dist` via `hooks/usePdfDocument.js` + `lib/pdf.js` (text extraction, word boxes, highlight boxes, scanned-PDF detection)
- **Zoom** — in-app 0.5x–2.5x, buttons + `Ctrl+scroll` / trackpad pinch (`Reader.js:395`)
- **Highlights & notes** — freeform + word-snapped highlights, per-page notes, bookmarks, all persisted per-book (`lib/storage.js`)
- **Fullscreen & distraction-free** — `useFullscreen`, `useIdleVisibility`, chrome auto-hides on idle, lockable

### Audio
- **Two sources, one toggle** — Web Speech TTS narration *or* uploaded audiobook
- **TTS** — `hooks/useSpeech.js` + `lib/speech.js` + `lib/textChunk.js` (chunking, voice/rate/pitch/volume, word highlighting, auto page-turn on `onChunkChange`)
- **Audiobook panel** — `hooks/useAudioPlayer.js`, `components/audio/*` (`AudioPlayer`, `Waveform` via `lib/audioAnalyser.js`, `VoiceSettings`), resume from `audioTime`, object-URL lifecycle
- **Large-file handling** — 80–500 MB blobs play from memory immediately, IndexedDB persist in background with warning on quota failure

### UX Polish
- **Themes** — light / dark / sepia CSS variables (`app/globals.css:5`, `ThemeToggle`)
- **Keyboard shortcuts** — `hooks/useKeyboardShortcuts.js` (prev/next, play/pause, volume, zoom, fullscreen, bookmark, highlight/erase, esc)
- **Paper texture & page shadows** — CSS-only grain, spine shadow
- **Animations** — `framer-motion` + `lucide-react`

---

## Tech Stack

- **Framework:** Next.js 15.5 (App Router), React 19.1
- **Styling:** Tailwind 3.4, PostCSS, `globals.css` CSS variables
- **PDF:** `pdfjs-dist` 4.9
- **Book flip:** `react-pageflip` 2.0
- **State/Storage:** React Context (`LibraryContext`), IndexedDB, localStorage
- **Other:** `framer-motion` 11, `lucide-react` 0.468

---

## Getting Started

### Prerequisites
- Node.js 18+ / npm

### Install & Run

```bash
# clone
git clone https://github.com/Amarjeet-op/libris.git
cd libris

# install
npm install

# dev
npm run dev
# -> http://localhost:3000

# production build
npm run build
npm start

# lint
npm run lint
```

### Project Structure

```
app/
  layout.js          # fonts (Libre Baskerville + Inter), LibraryProvider
  page.js            # Library home
  reader/[id]/page.js # Reader entry
  globals.css        # theme variables, paper texture, cursors
components/
  library/           # Library, BookCard
  reader/            # Reader, BookSpread, ReaderTopBar, ReadingControls, ReadingSidebar, PDFPage, DemoPage
  audio/             # AudioPlayer, AudiobookPanel, VoiceSettings, Waveform
  landing/           # UploadZone
  shared/            # TopNav, ThemeToggle, LoadingBook, EmptyState, ConfirmDialog
hooks/               # usePdfDocument, useSpeech, useAudioPlayer, useFullscreen, useIdleVisibility, useKeyboardShortcuts, useMediaQuery, useReducedMotion, useLocalStorage
lib/
  db.js              # IndexedDB file store (putFile/getFile/deleteFile)
  storage.js         # localStorage: bookState, voiceSettings, theme
  pdf.js             # pdfjs helpers, highlight/word boxes
  textChunk.js       # speech chunk builder
  speech.js          # speech synthesis helpers
  fileType.js        # isPdfFile/isAudioFile/resolveAudioMimeType
  demoBook.js        # demo pages
context/LibraryContext.js
```

---

## Usage

1. **Add books** — drag PDFs (and optionally a matching audio file) onto the Library upload zone or use the compact uploader in the header.
2. **Read** — open a book, flip with buttons / drag / arrow keys. Toggle single ↔ double layout, zoom with `Ctrl + scroll`.
3. **Listen** — pick **Narrate** (TTS — choose voice/rate/pitch) or **Audio** (uploaded file). Play/pause, seek, rate/volume all persistent.
4. **Mark up** — press `H` for highlight mode (drag to mark), `E` for eraser, click bookmark icon or press `B`. Notes per page in sidebar.
5. **Sidebar** — contents (jump to page), bookmarks, notes, audio settings.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Prev / next page |
| `Space` | Play / pause |
| `+` / `-` | Volume up / down |
| `Ctrl + +` / `Ctrl + -` / `Ctrl + 0` | Zoom in / out / reset (also `Ctrl+scroll`) |
| `F` | Fullscreen |
| `B` | Bookmark |
| `H` / `E` | Highlight / Erase mode |
| `Esc` | Close sidebar / exit mode / exit fullscreen |

---

## Data & Privacy

- **Everything stays on device.** PDFs/audio blobs → IndexedDB `libris-db`; reading progress, highlights, notes, bookmarks → `localStorage`. No server, no analytics.
- Deleting a book removes its blob from IndexedDB and state from localStorage.
- Large audio files (>80 MB) may exceed browser storage quota — Libris keeps them in memory for the session and warns if persist fails.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm start` | Serve build |
| `npm run lint` | ESLint (Next) |

## Configuration

- `next.config.mjs` — `eslint.ignoreDuringBuilds`, `devIndicators: false`, `canvas` alias for pdfjs
- `tailwind.config.js` — `class` dark mode, paper/ink palette, `book`/`card` shadows
- `jsconfig.json` — `@/*` path alias

---

## License

Private — not licensed for redistribution yet. Add a `LICENSE` file if you want to open-source.

---

Built with Next.js. Your books stay on this device.
