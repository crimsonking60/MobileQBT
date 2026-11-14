import { describe, expect, it } from 'vitest';
import type { Torrent } from './api/types';
import { detectEvents } from './notify';

const t = (over: Partial<Torrent>): Torrent => ({ hash: 'a', name: 'A', progress: 0.5, state: 'downloading', ...over }) as Torrent;

describe('detectEvents', () => {
  it('reports completion', () => {
    expect(detectEvents({ a: t({}) }, { a: t({ progress: 1, state: 'uploading' }) })).toEqual([{ kind: 'completed', hash: 'a', name: 'A' }]);
  });
  it('reports a new error once', () => {
    const err = t({ state: 'error' });
    expect(detectEvents({ a: t({}) }, { a: err })).toEqual([{ kind: 'error', hash: 'a', name: 'A' }]);
    expect(detectEvents({ a: err }, { a: err })).toEqual([]);
  });
  it('ignores torrents that were not in the previous snapshot', () => {
    expect(detectEvents({}, { a: t({ progress: 1 }) })).toEqual([]);
  });
  it('ignores already-complete torrents', () => {
    expect(detectEvents({ a: t({ progress: 1 }) }, { a: t({ progress: 1 }) })).toEqual([]);
  });
});
