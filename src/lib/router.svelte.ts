export type Tab = 'general' | 'trackers' | 'peers' | 'files' | 'speed';
export const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'trackers', label: 'Trackers' },
  { id: 'peers', label: 'Peers' },
  { id: 'files', label: 'Files' },
  { id: 'speed', label: 'Speed' },
];

const isTab = (s: string | undefined): s is Tab => TABS.some((t) => t.id === s);

/** Hash routes: `#/torrent/<hash>[/<tab>]`; anything else is the list. */
export function parseHash(hash: string): { torrent: string | null; tab: Tab; rss: boolean } {
  const [, kind, id, tab] = hash.replace(/^#/, '').split('/');
  if (kind === 'torrent' && id) return { torrent: id, tab: isTab(tab) ? tab : 'general', rss: false };
  if (kind === 'rss') return { torrent: null, tab: 'general', rss: true };
  return { torrent: null, tab: 'general', rss: false };
}

class Router {
  torrent = $state<string | null>(null);
  tab = $state<Tab>('general');
  /** the full-screen RSS section (`#/rss`) */
  rss = $state(false);

  constructor() {
    if (typeof window === 'undefined') return;
    const sync = () => Object.assign(this, parseHash(location.hash));
    sync();
    addEventListener('hashchange', () => { sync(); if (!this.torrent && !this.rss) this.#pushed = false; });
  }

  /** Tab switches replace the entry so Back leaves the detail view in one step. */
  open(hash: string, tab: Tab = 'general', replace = false) {
    const url = `#/torrent/${hash}/${tab}`;
    if (replace || this.torrent) history.replaceState(null, '', url);
    else { history.pushState(null, '', url); this.#pushed = true; }
    Object.assign(this, { torrent: hash, tab });
  }

  /** Back to the list; pops history only if we pushed the entry ourselves (not on a deep link). */
  close() {
    if (this.#pushed) { this.#pushed = false; history.back(); }
    else { history.replaceState(null, '', location.pathname + location.search); Object.assign(this, { torrent: null }); }
  }

  openRss() {
    history.pushState(null, '', '#/rss');
    this.#pushed = true;
    Object.assign(this, { torrent: null, rss: true });
  }

  closeRss() {
    if (this.#pushed) { this.#pushed = false; history.back(); }
    else { history.replaceState(null, '', location.pathname + location.search); Object.assign(this, { rss: false }); }
  }

  #pushed = false;
}

export const router = new Router();
