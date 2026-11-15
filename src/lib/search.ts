/** Lowercase, drop accents, and turn every run of punctuation (dashes, dots, underscores, quotes) into one space. */
const normalize = (s: string) =>
  s.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * Name filter for the list search box: every word in the query must appear in the name, in any order.
 * Punctuation is ignored, so "Paul Halpern - The Allure" finds "Paul.Halpern_-_The.Allure".
 */
export function nameMatcher(query: string): (name: string) => boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return () => true;
  return (name) => {
    const n = normalize(name);
    return words.every((w) => n.includes(w));
  };
}
