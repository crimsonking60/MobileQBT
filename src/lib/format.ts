import type { Torrent, TorrentState } from './api/types';

const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '–';
  let i = 0;
  while (n >= 1024 && i < UNITS.length - 1) { n /= 1024; i++; }
  return `${n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)} ${UNITS[i]}`;
}

export const formatSpeed = (n: number) => `${formatBytes(n)}/s`;

/** qBittorrent reports 8640000 s for "infinite". */
export function formatEta(s: number): string {
  if (s >= 8640000 || s < 0) return '∞';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export const formatPercent = (p: number) => `${p >= 1 ? 100 : (p * 100).toFixed(1)}%`;

export type StatusFilter =
  | 'all' | 'downloading' | 'seeding' | 'completed' | 'stopped'
  | 'active' | 'inactive' | 'stalled' | 'errored';

export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'downloading', label: 'Downloading' },
  { id: 'seeding', label: 'Seeding' },
  { id: 'completed', label: 'Completed' },
  { id: 'stopped', label: 'Stopped' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'stalled', label: 'Stalled' },
  { id: 'errored', label: 'Errored' },
];

const DL = new Set<TorrentState>(['downloading', 'metaDL', 'forcedMetaDL', 'forcedDL', 'stalledDL', 'queuedDL', 'checkingDL', 'allocating']);
const SEED = new Set<TorrentState>(['uploading', 'forcedUP', 'stalledUP', 'queuedUP', 'checkingUP']);
const STOPPED = new Set<TorrentState>(['stoppedDL', 'stoppedUP']);
const ERRORED = new Set<TorrentState>(['error', 'missingFiles']);

export function matchStatus(t: Torrent, f: StatusFilter): boolean {
  switch (f) {
    case 'all': return true;
    case 'downloading': return DL.has(t.state);
    case 'seeding': return SEED.has(t.state);
    case 'completed': return t.progress >= 1;
    case 'stopped': return STOPPED.has(t.state);
    case 'active': return t.dlspeed > 0 || t.upspeed > 0;
    case 'inactive': return t.dlspeed === 0 && t.upspeed === 0;
    case 'stalled': return t.state === 'stalledDL' || t.state === 'stalledUP';
    case 'errored': return ERRORED.has(t.state);
  }
}

export type Tone = 'down' | 'up' | 'idle' | 'error' | 'busy';

export function stateInfo(s: TorrentState): { label: string; tone: Tone } {
  switch (s) {
    case 'downloading': case 'forcedDL': return { label: 'Downloading', tone: 'down' };
    case 'metaDL': case 'forcedMetaDL': return { label: 'Fetching metadata', tone: 'down' };
    case 'uploading': case 'forcedUP': return { label: 'Seeding', tone: 'up' };
    case 'stalledDL': return { label: 'Stalled', tone: 'idle' };
    case 'stalledUP': return { label: 'Seeding (idle)', tone: 'up' };
    case 'queuedDL': case 'queuedUP': return { label: 'Queued', tone: 'idle' };
    case 'stoppedDL': return { label: 'Stopped', tone: 'idle' };
    case 'stoppedUP': return { label: 'Completed', tone: 'idle' };
    case 'checkingDL': case 'checkingUP': case 'checkingResumeData': return { label: 'Checking', tone: 'busy' };
    case 'allocating': return { label: 'Allocating', tone: 'busy' };
    case 'moving': return { label: 'Moving', tone: 'busy' };
    case 'error': return { label: 'Error', tone: 'error' };
    case 'missingFiles': return { label: 'Missing files', tone: 'error' };
    default: return { label: 'Unknown', tone: 'idle' };
  }
}

/** Unix seconds -> locale date-time; qBittorrent uses -1 / 0 for "never". */
export function formatDate(ts: number): string {
  return ts > 0 ? new Date(ts * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '–';
}

export function formatDuration(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '–';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${Math.floor(s)}s`;
}

/** Round a speed up to a tidy axis maximum in binary units (e.g. 1.3 MiB/s -> 2 MiB/s). */
export function niceSpeedMax(v: number): number {
  if (!(v > 0)) return 1024;
  const unit = 1024 ** Math.floor(Math.log(v) / Math.log(1024));
  const scaled = v / unit;
  const p = 10 ** Math.floor(Math.log10(scaled));
  return ([1, 2, 5, 10].find((m) => m * p >= scaled) ?? 10) * p * unit;
}
