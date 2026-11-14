import type { RssArticle, RssFeedData, RssRule, RssTree } from './api/types';

/** qBittorrent separates folders in RSS item paths with a backslash. */
export const SEP = '\\';

export interface Feed extends RssFeedData {
  /** full item path, e.g. "Folder\\My feed" */
  path: string;
  /** last path segment */
  name: string;
  articles: RssArticle[];
  unread: number;
}

export interface FeedArticle extends RssArticle {
  feedPath: string;
  feedName: string;
  time: number;
}

const isFeed = (n: RssFeedData | RssTree): n is RssFeedData => typeof (n as RssFeedData).url === 'string';

export function flattenFeeds(tree: RssTree, prefix = ''): Feed[] {
  const out: Feed[] = [];
  for (const [name, node] of Object.entries(tree)) {
    const path = prefix ? prefix + SEP + name : name;
    if (isFeed(node)) {
      const articles = node.articles ?? [];
      out.push({ ...node, path, name, articles, unread: articles.filter((a) => !a.isRead).length });
    } else out.push(...flattenFeeds(node, path));
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Parse qBittorrent's article date without trusting every browser's Date.parse with this odd format. */
export function parseArticleDate(s: string | undefined): number {
  if (!s) return 0;
  const m = /(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4}|GMT|UTC|Z)?/.exec(s);
  if (m) {
    const mon = MONTHS.indexOf(m[2].toLowerCase());
    if (mon >= 0) {
      const off = m[7] && /^[+-]/.test(m[7]) ? (m[7][0] === '-' ? -1 : 1) * (Number(m[7].slice(1, 3)) * 60 + Number(m[7].slice(3))) : 0;
      return Date.UTC(+m[3], mon, +m[1], +m[4], +m[5], +(m[6] ?? 0)) - off * 60_000;
    }
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

export function allArticles(feeds: Feed[]): FeedArticle[] {
  return feeds
    .flatMap((f) => f.articles.map((a) => ({ ...a, feedPath: f.path, feedName: f.name, time: parseArticleDate(a.date) })))
    .sort((a, b) => b.time - a.time || a.title.localeCompare(b.title));
}

/** Feed descriptions are HTML; show them as plain text. */
export function stripHtml(html: string | undefined): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style').forEach((n) => n.remove());
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** What to open in the add sheet for an article: the torrent URL, else a magnet/.torrent link. */
export function downloadUrl(a: Pick<RssArticle, 'torrentURL' | 'link'>): string | undefined {
  return a.torrentURL || (a.link && /^magnet:|\.torrent(\?|$)/i.test(a.link) ? a.link : undefined);
}

export interface RuleEdits {
  enabled: boolean;
  mustContain: string;
  mustNotContain: string;
  useRegex: boolean;
  episodeFilter: string;
  smartFilter: boolean;
  affectedFeeds: string[];
  ignoreDays: number;
  assignedCategory: string;
  savePath: string;
  addPaused: boolean;
}

export const blankRule = (): RuleEdits => ({
  enabled: true, mustContain: '', mustNotContain: '', useRegex: false, episodeFilter: '', smartFilter: false,
  affectedFeeds: [], ignoreDays: 0, assignedCategory: '', savePath: '', addPaused: false,
});

export function ruleToEdits(r: RssRule): RuleEdits {
  return {
    enabled: r.enabled, mustContain: r.mustContain, mustNotContain: r.mustNotContain, useRegex: r.useRegex,
    episodeFilter: r.episodeFilter, smartFilter: r.smartFilter, affectedFeeds: [...r.affectedFeeds],
    ignoreDays: r.ignoreDays, assignedCategory: r.assignedCategory, savePath: r.savePath, addPaused: !!r.addPaused,
  };
}

/**
 * The definition to send to rss/setRule: start from the stored rule (so fields we don't edit survive)
 * and mirror category/path/paused into torrentParams, which 5.x keeps alongside the legacy fields.
 */
export function editsToDef(base: RssRule | undefined, e: RuleEdits): RssRule {
  const def = { ...(base ?? {}), ...e } as RssRule;
  if (base?.torrentParams) {
    def.torrentParams = { ...base.torrentParams, category: e.assignedCategory, save_path: e.savePath, stopped: e.addPaused };
  }
  return def;
}
