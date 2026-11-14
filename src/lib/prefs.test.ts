import { describe, expect, it } from 'vitest';
import { bytesToKiB, diffPrefs, fromTime, kibToBytes, pickPrefs, toTime } from './prefs';

describe('prefs', () => {
  it('converts limits', () => {
    expect(bytesToKiB(2048)).toBe(2);
    expect(kibToBytes(2)).toBe(2048);
    expect(kibToBytes(-5)).toBe(0);
  });
  it('picks and diffs', () => {
    const a = pickPrefs({ dl_limit: 0, save_path: '/a', extra: 1 });
    expect('extra' in a).toBe(false);
    const b = { ...a, save_path: '/b' };
    expect(diffPrefs(a, b)).toEqual({ save_path: '/b' });
    expect(diffPrefs(a, a)).toEqual({});
  });
  it('round-trips times', () => {
    expect(toTime(7, 5)).toBe('07:05');
    expect(fromTime('07:05')).toEqual([7, 5]);
    expect(fromTime('')).toEqual([0, 0]);
  });
});
