import type { Peer } from './api/types';

/** Country code -> flag emoji (regional indicator pairs); empty for unknown. */
export function flagEmoji(code: string): string {
  if (!/^[a-z]{2}$/i.test(code)) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export const peerKey = (p: Peer) => (p.ip.includes(':') ? `[${p.ip}]:${p.port}` : `${p.ip}:${p.port}`);

/** Active peers first, then by progress. */
export function sortPeers(peers: Peer[]): Peer[] {
  return [...peers].sort(
    (a, b) => b.dl_speed + b.up_speed - (a.dl_speed + a.up_speed) || b.progress - a.progress,
  );
}
