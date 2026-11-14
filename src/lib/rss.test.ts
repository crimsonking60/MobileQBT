import { describe, expect, it } from 'vitest';
import type { RssRule, RssTree } from './api/types';
import { allArticles, blankRule, downloadUrl, editsToDef, flattenFeeds, parseArticleDate } from './rss';

const tree: RssTree = {
  Zed: { uid: 'z', url: 'http://z', articles: [{ id: '1', title: 'old', date: '14 Nov 2026 10:00:00 +0000', isRead: true }] },
  Folder: {
    Alpha: {
      uid: 'a', url: 'http://a',
      articles: [{ id: '2', title: 'new', date: '14 Nov 2026 12:00:00 +0000' }, { id: '3', title: 'newer', date: '14 Nov 2026 13:30:00 +0200' }],
    },
  },
};

describe('rss helpers', () => {
  it('flattens folders into feeds with paths and unread counts', () => {
    const feeds = flattenFeeds(tree);
    expect(feeds.map((f) => f.path)).toEqual(['Folder\\Alpha', 'Zed']);
    expect(feeds[0].name).toBe('Alpha');
    expect(feeds[0].unread).toBe(2);
    expect(feeds[1].unread).toBe(0);
  });
  it('parses article dates incl. offsets', () => {
    expect(parseArticleDate('14 Nov 2026 12:00:00 +0000')).toBe(Date.UTC(2026, 10, 14, 12));
    expect(parseArticleDate('14 Nov 2026 13:30:00 +0200')).toBe(Date.UTC(2026, 10, 14, 11, 30));
    expect(parseArticleDate('')).toBe(0);
    expect(parseArticleDate('garbage')).toBe(0);
  });
  it('merges articles newest first', () => {
    expect(allArticles(flattenFeeds(tree)).map((a) => a.title)).toEqual(['new', 'newer', 'old']);
  });
  it('picks a download url', () => {
    expect(downloadUrl({ torrentURL: 'magnet:?x' })).toBe('magnet:?x');
    expect(downloadUrl({ link: 'http://x/a.torrent' })).toBe('http://x/a.torrent');
    expect(downloadUrl({ link: 'http://x/page' })).toBeUndefined();
  });
  it('keeps unknown rule fields and mirrors into torrentParams', () => {
    const base = { ...blankRule(), priority: 3, torrentParams: { category: 'a', save_path: '', stopped: false, ratio_limit: -2 } } as unknown as RssRule;
    const def = editsToDef(base, { ...blankRule(), assignedCategory: 'tv', savePath: '/x', addPaused: true });
    expect(def.priority).toBe(3);
    expect(def.torrentParams).toMatchObject({ category: 'tv', save_path: '/x', stopped: true, ratio_limit: -2 });
    expect(editsToDef(undefined, blankRule()).torrentParams).toBeUndefined();
  });
});
