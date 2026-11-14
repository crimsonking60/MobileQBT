/** The subset of qBittorrent preferences the settings sheet edits. */
export interface Prefs {
  dl_limit: number; up_limit: number; alt_dl_limit: number; alt_up_limit: number;
  scheduler_enabled: boolean;
  schedule_from_hour: number; schedule_from_min: number;
  schedule_to_hour: number; schedule_to_min: number;
  scheduler_days: number;
  save_path: string; temp_path_enabled: boolean; temp_path: string;
  max_connec: number; max_connec_per_torrent: number;
  max_uploads: number; max_uploads_per_torrent: number;
  queueing_enabled: boolean;
  max_active_downloads: number; max_active_uploads: number; max_active_torrents: number;
}

export const PREF_KEYS: (keyof Prefs)[] = [
  'dl_limit', 'up_limit', 'alt_dl_limit', 'alt_up_limit',
  'scheduler_enabled', 'schedule_from_hour', 'schedule_from_min', 'schedule_to_hour', 'schedule_to_min', 'scheduler_days',
  'save_path', 'temp_path_enabled', 'temp_path',
  'max_connec', 'max_connec_per_torrent', 'max_uploads', 'max_uploads_per_torrent',
  'queueing_enabled', 'max_active_downloads', 'max_active_uploads', 'max_active_torrents',
];

export const SCHEDULER_DAYS = [
  'Every day', 'Weekdays', 'Weekends', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

/** Limits are bytes/s on the wire, KiB/s in the UI; 0 means unlimited both ways. */
export const bytesToKiB = (b: number) => Math.round(b / 1024);
export const kibToBytes = (k: number) => Math.max(0, Math.round(k)) * 1024;

export function pickPrefs(raw: Record<string, unknown>): Prefs {
  return Object.fromEntries(PREF_KEYS.map((k) => [k, raw[k]])) as unknown as Prefs;
}

/** Only the keys that changed, so saving never clobbers settings edited elsewhere. */
export function diffPrefs(orig: Prefs, cur: Prefs): Partial<Prefs> {
  const out: Record<string, unknown> = {};
  for (const k of PREF_KEYS) if (orig[k] !== cur[k]) out[k] = cur[k];
  return out as Partial<Prefs>;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const toTime = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`;
export function fromTime(s: string): [number, number] {
  const [h, m] = s.split(':').map(Number);
  return [Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0];
}
