import { describe, expect, it } from 'vitest';
import { stamp, unreleased } from './changelog.mjs';

const doc = `# Changelog

Intro.

## Unreleased

### Fixed
- A thing.

## 2026.11.1 - 2026-11-14

### Added
- First.
`;

describe('changelog', () => {
  it('reads the unreleased entries only', () => {
    expect(unreleased(doc)).toBe('### Fixed\n- A thing.');
  });

  it('is empty when nothing is listed', () => {
    expect(unreleased('# C\n\n## Unreleased\n\n## 2026.11.1 - 2026-11-14\n- x\n')).toBe('');
    expect(unreleased('# C\n')).toBe('');
  });

  it('reads unreleased entries at the end of the file', () => {
    expect(unreleased('# C\n\n## Unreleased\n\n- Only.\n')).toBe('- Only.');
  });

  it('stamps them into a dated section and starts a fresh Unreleased', () => {
    const out = stamp(doc, '2026.11.2', '2026-11-15');
    expect(out).toBe(`# Changelog

Intro.

## Unreleased

## 2026.11.2 - 2026-11-15

### Fixed
- A thing.

## 2026.11.1 - 2026-11-14

### Added
- First.
`);
    expect(unreleased(out)).toBe('');
  });

  it('refuses to stamp an empty release', () => {
    expect(() => stamp('# C\n\n## Unreleased\n\n', '2026.11.2', '2026-11-15')).toThrow();
  });
});
