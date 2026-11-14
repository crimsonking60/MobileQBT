import { describe, expect, it } from 'vitest';
import type { TorrentFile } from './api/types';
import { buildTree, nodeProgress, visibleRows } from './files';

const f = (index: number, name: string, size: number, progress = 1, priority: TorrentFile['priority'] = 1): TorrentFile =>
  ({ index, name, size, progress, priority, availability: 1 });

describe('buildTree', () => {
  const tree = buildTree([
    f(0, 'Show/S01/e02.mkv', 200, 0.5),
    f(1, 'Show/S01/e01.mkv', 100, 1),
    f(2, 'Show/readme.txt', 10, 0, 0),
  ]);

  it('nests by path, folders first', () => {
    expect(tree).toHaveLength(1);
    const show = tree[0];
    expect(show.children.map((c) => c.name)).toEqual(['S01', 'readme.txt']);
    expect(show.children[0].children.map((c) => c.name)).toEqual(['e01.mkv', 'e02.mkv']);
  });

  it('aggregates size, wanted bytes and progress', () => {
    const show = tree[0];
    expect(show.size).toBe(310);
    expect(show.wanted).toBe(300); // skipped file excluded
    expect(nodeProgress(show)).toBeCloseTo(200 / 300);
    expect(show.indexes.sort()).toEqual([0, 1, 2]);
  });

  it('reports mixed priority on folders', () => {
    expect(tree[0].priority).toBe('mixed');
    expect(tree[0].children[0].priority).toBe(1);
  });

  it('flattens only expanded folders', () => {
    expect(visibleRows(tree, new Set()).map((r) => r.node.name)).toEqual(['Show']);
    const open = visibleRows(tree, new Set(['Show']));
    expect(open.map((r) => [r.node.name, r.depth])).toEqual([['Show', 0], ['S01', 1], ['readme.txt', 1]]);
  });
});
