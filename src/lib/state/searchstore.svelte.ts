import { ApiError, api } from '../api/client';
import type { SearchResult } from '../api/types';

export type SearchPhase = 'idle' | 'running' | 'done' | 'error';

const POLL_MS = 1000;
const PAGE = 500;

/**
 * One search at a time. The plugins run on the qBittorrent host and results arrive while they work, so the
 * store polls the job, appends what is new, and removes the job from the server when it ends or the screen
 * is left (the server keeps only a handful of search jobs).
 */
class SearchStore {
  query = $state('');
  category = $state('all');
  /** 'enabled', or one plugin's id */
  plugin = $state('enabled');

  results = $state.raw<SearchResult[]>([]);
  phase = $state<SearchPhase>('idle');
  error = $state<string | null>(null);
  /** what the last search was for, shown above its results */
  ran = $state<{ query: string; category: string; plugin: string } | null>(null);

  #id: number | null = null;
  /** bumped by every start and stop so a loop that lost its turn notices and ends */
  #generation = 0;

  async start() {
    const pattern = this.query.trim();
    if (!pattern) return;
    const gen = ++this.#generation;
    await this.#release();
    this.results = [];
    this.error = null;
    this.phase = 'running';
    this.ran = { query: pattern, category: this.category, plugin: this.plugin };
    try {
      // jobs left behind by an earlier visit would eat into the server's limit
      for (const s of await api.searchStatus()) await api.searchDelete(s.id).catch(() => {});
      if (gen !== this.#generation) return;
      const id = await api.searchStart(pattern, this.category, this.plugin);
      if (gen !== this.#generation) { void api.searchDelete(id).catch(() => {}); return; }
      this.#id = id;
      await this.#follow(id, gen);
    } catch (e) {
      if (gen !== this.#generation) return;
      this.phase = 'error';
      this.error = explain(e);
    }
  }

  async #follow(id: number, gen: number) {
    let offset = 0;
    for (;;) {
      const page = await api.searchResults(id, offset, PAGE);
      if (gen !== this.#generation) return;
      if (page.results.length) {
        this.results = [...this.results, ...page.results];
        offset += page.results.length;
      }
      if (page.status === 'Stopped' && offset >= page.total) break;
      await new Promise((r) => setTimeout(r, page.results.length >= PAGE ? 0 : POLL_MS));
      if (gen !== this.#generation) return;
    }
    this.phase = 'done';
    await this.#release();
  }

  /** Stop waiting for the running search (what has arrived stays). */
  async stop() {
    this.#generation++;
    if (this.phase === 'running') this.phase = 'done';
    await this.#release(true);
  }

  /** Leaving the screen: end any running search and free its server job, keep the results. */
  dispose() {
    void this.stop();
  }

  async #release(stopFirst = false) {
    const id = this.#id;
    this.#id = null;
    if (id === null) return;
    if (stopFirst) await api.searchStop(id).catch(() => {});
    await api.searchDelete(id).catch(() => {});
  }
}

function explain(e: unknown): string {
  if (e instanceof ApiError && e.status === 409) return "qBittorrent can't start another search right now. Try again in a moment.";
  const msg = e instanceof Error ? e.message : String(e);
  return msg || 'The search failed';
}

export const searchStore = new SearchStore();
