const PREFIX = "libris:";

function safeParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(PREFIX + key), fallback);
}

export function writeJSON(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — fail silently, app still works in-memory
  }
}

export function removeKey(key) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PREFIX + key);
}

// ---- domain-specific helpers ----

export function getTheme() {
  return readJSON("theme", "light");
}

export function setTheme(theme) {
  writeJSON("theme", theme);
}

export function getLibrary() {
  return readJSON("library", []);
}

export function setLibrary(books) {
  writeJSON("library", books);
}

export function getBookState(id) {
  return readJSON(`book:${id}`, {
    currentPage: 1,
    progress: 0,
    bookmarks: [],
    secondsRead: 0,
    lastOpenedAt: null,
    audioTime: 0,
  });
}

export function setBookState(id, state) {
  writeJSON(`book:${id}`, state);
}

export function deleteBookState(id) {
  removeKey(`book:${id}`);
}

export function getVoiceSettings() {
  return readJSON("voiceSettings", {
    voiceName: null,
    rate: 1,
    pitch: 1,
    volume: 1,
  });
}

export function setVoiceSettings(settings) {
  writeJSON("voiceSettings", settings);
}
