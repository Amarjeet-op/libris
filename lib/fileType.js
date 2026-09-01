const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|webm)$/i;

const AUDIO_MIME_BY_EXT = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  webm: "audio/webm",
};

export function isPdfFile(file) {
  return file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
}

export function isAudioFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("audio/")) return true;
  return AUDIO_EXT.test(file.name || "");
}

// Some browser/OS combos leave File.type empty (or wrong) for less common
// extensions like .m4a/.aac — the file picker can't always sniff a MIME type.
// A blob URL with no/incorrect type makes <audio> refuse to play a file that
// would otherwise decode fine, surfacing as "format isn't supported". Look up
// a MIME type by extension whenever the reported type isn't already audio/*.
export function resolveAudioMimeType(file) {
  if (file?.type && file.type.startsWith("audio/")) return file.type;
  const ext = file?.name?.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  return AUDIO_MIME_BY_EXT[ext] || file?.type || "audio/mpeg";
}
