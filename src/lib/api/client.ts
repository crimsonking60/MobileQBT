import type { AddTorrentOptions, MainData } from './types';

const BASE: string = import.meta.env.VITE_API_BASE ?? 'api/v2';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${BASE}/${path}`, { credentials: 'same-origin', ...init });
  if (res.status === 401 || res.status === 403) throw new ApiError(res.status, 'Not authenticated');
  if (!res.ok) throw new ApiError(res.status, (await res.text()) || res.statusText);
  return res;
}

function form(data: Record<string, string | number | boolean>): RequestInit {
  return { method: 'POST', body: new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v)])) };
}

const hashes = (h: string[]) => h.join('|');

export const api = {
  /** Resolves true on success; qBittorrent answers 200 "Fails." on bad credentials. */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await request('auth/login', form({ username, password }));
      return (await res.text()).trim() !== 'Fails.';
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return false;
      throw e;
    }
  },
  logout: () => request('auth/logout', { method: 'POST' }),
  version: async () => (await request('app/version')).text(),

  async maindata(rid: number): Promise<MainData> {
    return (await request(`sync/maindata?rid=${rid}`)).json();
  },

  // v5 renamed pause/resume to stop/start
  stop: (h: string[]) => request('torrents/stop', form({ hashes: hashes(h) })),
  start: (h: string[]) => request('torrents/start', form({ hashes: hashes(h) })),
  forceStart: (h: string[], value = true) =>
    request('torrents/setForceStart', form({ hashes: hashes(h), value })),
  recheck: (h: string[]) => request('torrents/recheck', form({ hashes: hashes(h) })),
  reannounce: (h: string[]) => request('torrents/reannounce', form({ hashes: hashes(h) })),
  remove: (h: string[], deleteFiles: boolean) =>
    request('torrents/delete', form({ hashes: hashes(h), deleteFiles })),
  setCategory: (h: string[], category: string) =>
    request('torrents/setCategory', form({ hashes: hashes(h), category })),
  addTags: (h: string[], tags: string[]) =>
    request('torrents/addTags', form({ hashes: hashes(h), tags: tags.join(',') })),
  removeTags: (h: string[], tags: string[]) =>
    request('torrents/removeTags', form({ hashes: hashes(h), tags: tags.join(',') })),
  priority: (h: string[], op: 'topPrio' | 'bottomPrio' | 'increasePrio' | 'decreasePrio') =>
    request(`torrents/${op}`, form({ hashes: hashes(h) })),

  toggleAltSpeed: () => request('transfer/toggleSpeedLimitsMode', { method: 'POST' }),

  async add(opts: AddTorrentOptions) {
    const body = new FormData();
    if (opts.urls) body.set('urls', opts.urls);
    for (const f of opts.files ?? []) body.append('torrents', f, f.name);
    if (opts.savepath) body.set('savepath', opts.savepath);
    if (opts.category) body.set('category', opts.category);
    if (opts.tags) body.set('tags', opts.tags);
    if (opts.stopped) body.set('stopped', 'true');
    if (opts.sequentialDownload) body.set('sequentialDownload', 'true');
    if (opts.firstLastPiecePrio) body.set('firstLastPiecePrio', 'true');
    const res = await request('torrents/add', { method: 'POST', body });
    if ((await res.text()).trim() === 'Fails.') throw new ApiError(400, 'qBittorrent rejected the torrent');
  },
};
