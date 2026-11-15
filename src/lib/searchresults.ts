import type { SearchCategory, SearchPlugin, SearchResult } from './api/types';
import { nameMatcher } from './search';

export type ResultSort = 'seeders' | 'size' | 'name' | 'date';

export const RESULT_SORTS: { id: ResultSort; label: string }[] = [
  { id: 'seeders', label: 'Seeders' },
  { id: 'size', label: 'Size' },
  { id: 'date', label: 'Date' },
  { id: 'name', label: 'Name' },
];

/** Narrow by name (same word matching as the torrent list) and sort; the input is left alone. */
export function arrangeResults(list: SearchResult[], query: string, sort: ResultSort, desc: boolean): SearchResult[] {
  const matches = nameMatcher(query);
  const dir = desc ? -1 : 1;
  const key = (r: SearchResult): string | number =>
    ({ seeders: r.nbSeeders, size: r.fileSize, date: r.pubDate ?? 0, name: r.fileName })[sort];
  return list
    .filter((r) => matches(r.fileName))
    .sort((a, b) => {
      const x = key(a), y = key(b);
      const c = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number);
      return c * dir || a.fileName.localeCompare(b.fileName);
    });
}

export const isMagnet = (url: string) => url.trim().toLowerCase().startsWith('magnet:');

/** Host name without `www.`, or an empty string for anything that isn't a URL. */
export const siteName = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};

/** The plugin a result came from, found by its site (results only carry the site's address). */
export function pluginForResult(r: SearchResult, plugins: SearchPlugin[]): SearchPlugin | undefined {
  const h = siteName(r.siteUrl);
  return h ? plugins.find((p) => siteName(p.url) === h) : undefined;
}

/** `all` first, then alphabetical, for the categories the chosen plugins understand together. */
export function categoriesFor(plugins: SearchPlugin[]): SearchCategory[] {
  const seen = new Map<string, string>();
  for (const p of plugins) for (const c of p.supportedCategories) if (!seen.has(c.id)) seen.set(c.id, c.name);
  seen.set('all', seen.get('all') ?? 'All categories');
  return [...seen].map(([id, name]) => ({ id, name }))
    .sort((a, b) => (a.id === 'all' ? -1 : b.id === 'all' ? 1 : a.name.localeCompare(b.name)));
}

/** Plugins a search would use for a selection: 'enabled' (the default), or one plugin by id. */
export function pluginsInScope(plugins: SearchPlugin[], selection: string): SearchPlugin[] {
  return selection === 'enabled' ? plugins.filter((p) => p.enabled) : plugins.filter((p) => p.name === selection);
}
