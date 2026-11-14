import type { Category, MainData, ServerState, Torrent } from '../api/types';

export interface SyncState {
  rid: number;
  torrents: Record<string, Torrent>;
  categories: Record<string, Category>;
  tags: string[];
  serverState: Partial<ServerState>;
}

export const emptyState = (): SyncState => ({
  rid: 0,
  torrents: {},
  categories: {},
  tags: [],
  serverState: {},
});

/** Apply a sync/maindata response; returns a new state (inputs are not mutated). */
export function applyMainData(prev: SyncState, d: MainData): SyncState {
  const base = d.full_update ? emptyState() : prev;

  const torrents = { ...base.torrents };
  for (const [hash, patch] of Object.entries(d.torrents ?? {})) {
    torrents[hash] = { ...(torrents[hash] ?? { hash }), ...patch } as Torrent;
  }
  for (const hash of d.torrents_removed ?? []) delete torrents[hash];

  const categories = { ...base.categories };
  for (const [name, patch] of Object.entries(d.categories ?? {})) {
    categories[name] = { ...(categories[name] ?? { name, savePath: '' }), ...patch };
  }
  for (const name of d.categories_removed ?? []) delete categories[name];

  let tags = base.tags;
  if (d.tags?.length) tags = [...new Set([...tags, ...d.tags])];
  if (d.tags_removed?.length) tags = tags.filter((t) => !d.tags_removed!.includes(t));

  return {
    rid: d.rid,
    torrents,
    categories,
    tags,
    serverState: { ...base.serverState, ...d.server_state },
  };
}
