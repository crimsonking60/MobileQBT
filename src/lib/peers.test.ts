import { describe, expect, it } from 'vitest';
import type { Peer } from './api/types';
import { flagEmoji, peerKey, sortPeers } from './peers';

const p = (o: Partial<Peer>) => ({ ip: '1.1.1.1', port: 1, dl_speed: 0, up_speed: 0, progress: 0, ...o }) as Peer;

describe('peers', () => {
  it('builds flags', () => {
    expect(flagEmoji('SE')).toBe('🇸🇪');
    expect(flagEmoji('')).toBe('');
  });
  it('formats ipv6 keys', () => {
    expect(peerKey(p({ ip: '::1', port: 5 }))).toBe('[::1]:5');
    expect(peerKey(p({ ip: '1.2.3.4', port: 5 }))).toBe('1.2.3.4:5');
  });
  it('sorts active first', () => {
    const a = p({ ip: 'a', progress: 0.9 }), b = p({ ip: 'b', dl_speed: 5 });
    expect(sortPeers([a, b]).map((x) => x.ip)).toEqual(['b', 'a']);
  });
});
