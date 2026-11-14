import { describe, expect, it } from 'vitest';
import { formatBytes, formatEta, formatPercent, matchStatus } from './format';
import type { Torrent } from './api/types';

describe('format', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KiB');
    expect(formatBytes(5 * 1024 ** 3)).toBe('5.0 GiB');
  });
  it('formats eta', () => {
    expect(formatEta(8640000)).toBe('∞');
    expect(formatEta(90)).toBe('1m');
    expect(formatEta(3700)).toBe('1h 1m');
  });
  it('formats percent', () => {
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0.4567)).toBe('45.7%');
  });
  it('matches status filters', () => {
    const t = { state: 'stalledUP', progress: 1, dlspeed: 0, upspeed: 0 } as Torrent;
    expect(matchStatus(t, 'seeding')).toBe(true);
    expect(matchStatus(t, 'completed')).toBe(true);
    expect(matchStatus(t, 'inactive')).toBe(true);
    expect(matchStatus(t, 'downloading')).toBe(false);
  });
});
