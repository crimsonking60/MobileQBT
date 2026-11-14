import { describe, expect, it } from 'vitest';
import { nextVersion } from './next-version.mjs';

describe('nextVersion', () => {
  it('starts at 1 for a new month', () => {
    expect(nextVersion([], 2026, 11)).toBe('2026.11.1');
    expect(nextVersion(['2026.10.7'], 2026, 11)).toBe('2026.11.1');
  });
  it('increments within the month, zero-padding the month', () => {
    expect(nextVersion(['2026.03.1', '2026.03.2'], 2026, 3)).toBe('2026.03.3');
  });
  it('uses the highest number, not the count, and compares numerically', () => {
    expect(nextVersion(['2026.11.2', '2026.11.10', '2026.11.9'], 2026, 11)).toBe('2026.11.11');
  });
  it('ignores unrelated tags', () => {
    expect(nextVersion(['v1.0.0', '2026.11.x', '2026.11.1-rc1', '2026.11.0', '', '2026.111.4'], 2026, 11)).toBe('2026.11.1');
  });
});
