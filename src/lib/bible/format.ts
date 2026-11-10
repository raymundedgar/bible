export function formatReference(
  commonName: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): string {
  const verses =
    verseStart === verseEnd ? `${verseStart}` : `${verseStart}-${verseEnd}`;
  return `${commonName} ${chapter}:${verses}`;
}

export function joinVerseText(parts: string[]): string {
  return parts
    .map((part) => part.replace(/\s+\n/g, "\n").trim())
    .filter(Boolean)
    .join("\n\n");
}
