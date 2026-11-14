import { describe, expect, it } from 'vitest';
import { takeMagnetFromUrl } from './addui.svelte';

const loc = (search: string, hash = '') => ({ search, pathname: '/app/', hash }) as Location;

describe('takeMagnetFromUrl', () => {
  it('extracts a magnet and strips it from the url', () => {
    let replaced = '';
    const m = takeMagnetFromUrl(loc('?magnet=magnet%3A%3Fxt%3Durn%3Abtih%3Aabc', '#/torrent/x'), (u) => (replaced = u));
    expect(m).toBe('magnet:?xt=urn:btih:abc');
    expect(replaced).toBe('/app/#/torrent/x');
  });
  it('keeps other params', () => {
    let replaced = '';
    takeMagnetFromUrl(loc('?a=1&magnet=x'), (u) => (replaced = u));
    expect(replaced).toBe('/app/?a=1');
  });
  it('returns null when absent', () => {
    expect(takeMagnetFromUrl(loc(''), () => { throw new Error('no'); })).toBeNull();
  });
});
