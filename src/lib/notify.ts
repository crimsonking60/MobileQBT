import type { Torrent } from './api/types';

export interface NotifyEvent { kind: 'completed' | 'error'; hash: string; name: string }

const ERROR_STATES = new Set(['error', 'missingFiles']);

/**
 * Transitions worth telling the user about. Only torrents present in both snapshots count, so the
 * first load, a re-login or a freshly added (already complete) torrent never fires.
 */
export function detectEvents(prev: Record<string, Torrent>, next: Record<string, Torrent>): NotifyEvent[] {
  const out: NotifyEvent[] = [];
  for (const [hash, t] of Object.entries(next)) {
    const p = prev[hash];
    if (!p) continue;
    if (p.progress < 1 && t.progress >= 1) out.push({ kind: 'completed', hash, name: t.name });
    else if (!ERROR_STATES.has(p.state) && ERROR_STATES.has(t.state)) out.push({ kind: 'error', hash, name: t.name });
  }
  return out;
}

export function describe(e: NotifyEvent): { title: string; body: string } {
  return e.kind === 'completed'
    ? { title: 'Download complete', body: e.name }
    : { title: 'Torrent error', body: e.name };
}
