// Next calendar version, YYYY.MM.N: N counts releases within the month, starting at 1.
//   node scripts/next-version.mjs [YYYY-MM] < tags.txt      (one tag per line; month defaults to now, UTC)
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

export function nextVersion(tags, year, month) {
  const prefix = `${year}.${String(month).padStart(2, '0')}.`;
  let max = 0;
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag.startsWith(prefix)) continue;
    const rest = tag.slice(prefix.length);
    if (/^[1-9]\d*$/.test(rest)) max = Math.max(max, Number(rest));
  }
  return `${prefix}${max + 1}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const now = new Date();
  const [y, m] = process.argv[2] ? process.argv[2].split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  console.log(nextVersion(readFileSync(0, 'utf8').split('\n'), y, m));
}
