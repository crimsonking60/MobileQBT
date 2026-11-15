import { describe, expect, it } from 'vitest';
import { parseHash } from './router.svelte';

describe('parseHash', () => {
  it('parses torrent routes', () => {
    expect(parseHash('#/torrent/abc/files')).toEqual({ torrent: 'abc', tab: 'files', rss: false, search: false });
    expect(parseHash('#/torrent/abc')).toEqual({ torrent: 'abc', tab: 'general', rss: false, search: false });
    expect(parseHash('#/torrent/abc/bogus')).toEqual({ torrent: 'abc', tab: 'general', rss: false, search: false });
  });
  it('parses the rss route', () => {
    expect(parseHash('#/rss')).toEqual({ torrent: null, tab: 'general', rss: true, search: false });
  });
  it('parses the search route', () => {
    expect(parseHash('#/search')).toEqual({ torrent: null, tab: 'general', rss: false, search: true });
  });
  it('falls back to the list', () => {
    expect(parseHash('')).toEqual({ torrent: null, tab: 'general', rss: false, search: false });
    expect(parseHash('#/nope')).toEqual({ torrent: null, tab: 'general', rss: false, search: false });
  });
});
