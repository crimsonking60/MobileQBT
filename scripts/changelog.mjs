// Keep a Changelog helpers for the release workflow.
//   node scripts/changelog.mjs notes            print the "Unreleased" entries (empty output if none)
//   node scripts/changelog.mjs stamp VERSION [YYYY-MM-DD]
//                                               turn "Unreleased" into "VERSION - date" and start a new empty one
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const HEADING = /^## Unreleased[ \t]*$/m;

/** Entries under "## Unreleased", up to the next "## " heading. */
export function unreleased(text) {
  const m = HEADING.exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/^## /m);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

/** Move the Unreleased entries into a dated section. Throws if there is nothing to release. */
export function stamp(text, version, date) {
  const body = unreleased(text);
  if (!body) throw new Error('nothing under "## Unreleased"');
  const m = HEADING.exec(text);
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/^## /m);
  const tail = next < 0 ? '' : rest.slice(next);
  return `${text.slice(0, m.index)}## Unreleased\n\n## ${version} - ${date}\n\n${body}\n\n${tail}`.replace(/\n+$/, '\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, version, date] = process.argv.slice(2);
  const file = new URL('../CHANGELOG.md', import.meta.url);
  const text = readFileSync(file, 'utf8');
  if (cmd === 'notes') {
    process.stdout.write(unreleased(text) ? unreleased(text) + '\n' : '');
  } else if (cmd === 'stamp' && version) {
    writeFileSync(file, stamp(text, version, date ?? new Date().toISOString().slice(0, 10)));
  } else {
    console.error('usage: changelog.mjs notes | stamp VERSION [DATE]');
    process.exit(2);
  }
}
