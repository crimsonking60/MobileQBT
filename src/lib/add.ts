/** One URL per line (magnet:, http(s):, or a bare info hash); blanks and duplicates dropped. */
export function parseUrls(text: string): string[] {
  return [...new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
}
