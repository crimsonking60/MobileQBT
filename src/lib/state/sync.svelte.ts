import { api, ApiError } from '../api/client';
import { applyMainData, emptyState, type SyncState } from './merge';
import { notifier } from './notify.svelte';

export type Phase = 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error';

const INTERVAL_MS = 2000;
/** with notifications on we keep polling in a hidden tab, just less often */
const HIDDEN_INTERVAL_MS = 15000;

/** Polls sync/maindata and exposes the merged state reactively. */
class SyncStore {
  data = $state<SyncState>(emptyState());
  phase = $state<Phase>('idle');
  error = $state<string | null>(null);

  #timer: ReturnType<typeof setTimeout> | undefined;
  #running = false;

  start() {
    if (this.#running) return;
    this.#running = true;
    if (this.phase === 'idle') this.phase = 'loading';
    document.addEventListener('visibilitychange', this.#onVisibility);
    void this.#tick();
  }

  stop() {
    this.#running = false;
    clearTimeout(this.#timer);
    document.removeEventListener('visibilitychange', this.#onVisibility);
  }

  /** Drop all state and resync from scratch (e.g. after login). */
  reset() {
    this.data = emptyState();
    this.phase = 'loading';
    this.error = null;
  }

  /** Poll immediately, e.g. after an action, instead of waiting for the next tick. */
  refresh() {
    if (!this.#running) return;
    clearTimeout(this.#timer);
    void this.#tick();
  }

  #onVisibility = () => {
    if (document.hidden && !notifier.enabled) clearTimeout(this.#timer);
    else if (!document.hidden) this.refresh();
  };

  async #tick() {
    if (!this.#running) return;
    try {
      const d = await api.maindata(this.data.rid);
      const before = this.phase === 'ready' ? this.data.torrents : null;
      this.data = applyMainData(this.data, d);
      if (before) notifier.check(before, this.data.torrents);
      this.phase = 'ready';
      this.error = null;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        this.phase = 'unauthenticated';
        return; // stop polling until login calls reset()+refresh()
      }
      this.error = e instanceof Error ? e.message : String(e);
      if (this.phase !== 'ready') this.phase = 'error';
    }
    if (!this.#running) return;
    if (!document.hidden) this.#timer = setTimeout(() => this.#tick(), INTERVAL_MS);
    else if (notifier.enabled) this.#timer = setTimeout(() => this.#tick(), HIDDEN_INTERVAL_MS);
  }
}

export const sync = new SyncStore();
