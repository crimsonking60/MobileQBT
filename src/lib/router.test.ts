import { describe, expect, it } from 'vitest';
import { parseHash } from './router.svelte';

describe('parseHash', () => {
  it('parses torrent routes', () => {
    expect(parseHash('#/torrent/abc/files')).toEqual({ torrent: 'abc', tab: 'files' });
    expect(parseHash('#/torrent/abc')).toEqual({ torrent: 'abc', tab: 'general' });
    expect(parseHash('#/torrent/abc/bogus')).toEqual({ torrent: 'abc', tab: 'general' });
  });
  it('falls back to the list', () => {
    expect(parseHash('')).toEqual({ torrent: null, tab: 'general' });
    expect(parseHash('#/nope')).toEqual({ torrent: null, tab: 'general' });
  });
});
