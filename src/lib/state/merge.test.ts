import { describe, expect, it } from 'vitest';
import { applyMainData, emptyState } from './merge';

describe('applyMainData', () => {
  it('builds state from a full update', () => {
    const s = applyMainData(emptyState(), {
      rid: 1,
      full_update: true,
      torrents: { a: { name: 'A', progress: 0.5 } },
      categories: { tv: { name: 'tv', savePath: '/tv' } },
      tags: ['x'],
      server_state: { dl_info_speed: 10 },
    });
    expect(s.rid).toBe(1);
    expect(s.torrents.a).toMatchObject({ hash: 'a', name: 'A', progress: 0.5 });
    expect(s.categories.tv.savePath).toBe('/tv');
    expect(s.tags).toEqual(['x']);
    expect(s.serverState.dl_info_speed).toBe(10);
  });

  it('merges partial torrent patches and removals', () => {
    const s1 = applyMainData(emptyState(), {
      rid: 1, full_update: true,
      torrents: { a: { name: 'A', progress: 0.1 }, b: { name: 'B' } },
    });
    const s2 = applyMainData(s1, {
      rid: 2, torrents: { a: { progress: 0.9 } }, torrents_removed: ['b'],
    });
    expect(s2.torrents.a).toMatchObject({ name: 'A', progress: 0.9 });
    expect(s2.torrents.b).toBeUndefined();
    expect(s1.torrents.a.progress).toBe(0.1); // no mutation
  });

  it('resets everything on full_update', () => {
    const s1 = applyMainData(emptyState(), { rid: 1, full_update: true, torrents: { a: { name: 'A' } } });
    const s2 = applyMainData(s1, { rid: 5, full_update: true, torrents: { c: { name: 'C' } } });
    expect(Object.keys(s2.torrents)).toEqual(['c']);
  });

  it('adds and removes tags and categories', () => {
    const s1 = applyMainData(emptyState(), {
      rid: 1, full_update: true, tags: ['a', 'b'], categories: { x: { name: 'x' } },
    });
    const s2 = applyMainData(s1, { rid: 2, tags: ['c'], tags_removed: ['a'], categories_removed: ['x'] });
    expect(s2.tags).toEqual(['b', 'c']);
    expect(s2.categories.x).toBeUndefined();
  });
});
