import { describe, expect, it } from 'vitest';
import type { SearchPlugin, SearchResult } from './api/types';
import { arrangeResults, categoriesFor, isMagnet, pluginForResult, pluginsInScope, siteName } from './searchresults';

const r = (fileName: string, nbSeeders: number, fileSize = 1, pubDate?: number): SearchResult =>
  ({ fileName, nbSeeders, fileSize, fileUrl: 'magnet:?xt=urn:btih:x', nbLeechers: 0, siteUrl: 'http://a.example', descrLink: '', pubDate });

const plugin = (name: string, url: string, enabled: boolean, cats: string[]): SearchPlugin => ({
  name, fullName: name, enabled, version: '1.0', url, supportedCategories: cats.map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1) })),
});

describe('arrangeResults', () => {
  const list = [r('b book', 5, 300, 20), r('a book', 50, 100, 10), r('c movie', 5, 200, 30)];

  it('sorts by seeders descending and breaks ties by name', () => {
    expect(arrangeResults(list, '', 'seeders', true).map((x) => x.fileName)).toEqual(['a book', 'b book', 'c movie']);
  });

  it('sorts by size, date and name in either direction', () => {
    expect(arrangeResults(list, '', 'size', false).map((x) => x.fileSize)).toEqual([100, 200, 300]);
    expect(arrangeResults(list, '', 'date', true).map((x) => x.pubDate)).toEqual([30, 20, 10]);
    expect(arrangeResults(list, '', 'name', false).map((x) => x.fileName)).toEqual(['a book', 'b book', 'c movie']);
  });

  it('treats a missing date as oldest', () => {
    expect(arrangeResults([r('x', 1), r('y', 1, 1, 5)], '', 'date', true).map((x) => x.fileName)).toEqual(['y', 'x']);
  });

  it('filters by words, ignoring punctuation, and does not touch the input', () => {
    const copy = [...list];
    expect(arrangeResults(list, 'BOOK', 'seeders', true)).toHaveLength(2);
    expect(arrangeResults(list, 'a-book', 'seeders', true)).toHaveLength(1);
    expect(list).toEqual(copy);
  });
});

describe('isMagnet', () => {
  it('recognises magnet links only', () => {
    expect(isMagnet(' MAGNET:?xt=urn:btih:abc')).toBe(true);
    expect(isMagnet('https://example.com/a.torrent')).toBe(false);
  });
});

describe('siteName', () => {
  it('gives the host without www, or nothing', () => {
    expect(siteName('https://www.example.org/path')).toBe('example.org');
    expect(siteName('')).toBe('');
    expect(siteName('not a url')).toBe('');
  });
});

describe('plugins', () => {
  const a = plugin('a', 'https://www.a.example', true, ['all', 'books', 'movies']);
  const b = plugin('b', 'http://b.example/', false, ['all', 'music']);

  it('finds the plugin behind a result by its site, ignoring www and scheme', () => {
    expect(pluginForResult({ ...r('x', 1), siteUrl: 'http://a.example' }, [a, b])?.name).toBe('a');
    expect(pluginForResult({ ...r('x', 1), siteUrl: 'https://b.example' }, [a, b])?.name).toBe('b');
    expect(pluginForResult({ ...r('x', 1), siteUrl: 'http://other.example' }, [a, b])).toBeUndefined();
    expect(pluginForResult({ ...r('x', 1), siteUrl: '' }, [a, b])).toBeUndefined();
  });

  it('scopes a selection to the enabled plugins or one named plugin', () => {
    expect(pluginsInScope([a, b], 'enabled').map((p) => p.name)).toEqual(['a']);
    expect(pluginsInScope([a, b], 'b').map((p) => p.name)).toEqual(['b']);
  });

  it('merges categories with "all" first', () => {
    expect(categoriesFor([a, b]).map((c) => c.id)).toEqual(['all', 'books', 'movies', 'music']);
    expect(categoriesFor([]).map((c) => c.id)).toEqual(['all']);
  });
});
