// Checks whether a piece of text is a valid, safe website URL (http or https).
// Used when creating/editing a project (FE-03).
export function isValidUrl(value: string): boolean {
  try {
    // new URL(...) throws its own error if the text isn't a valid URL —
    // we use that here as a simple way to check it.
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    // Couldn't even be read as a URL (e.g. "hallo") -> invalid.
    return false;
  }
}

// Checks whether text (e.g. feedback or a reply) is not empty and not too long.
// Used when placing feedback (FE-05) and replies (FE-08).
export function isValidText(value: string, maxLength = 500): boolean {
  const text = value.trim(); // leading/trailing spaces don't count
  return text.length > 0 && text.length <= maxLength;
}