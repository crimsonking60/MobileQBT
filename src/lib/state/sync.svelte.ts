import { api, ApiError } from '../api/client';
import { applyMainData, emptyState, type SyncState } from './merge';

export type Phase = 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error';

const INTERVAL_MS = 2000;

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
    if (document.hidden) clearTimeout(this.#timer);
    else this.refresh();
  };

  async #tick() {
    if (!this.#running) return;
    try {
      const d = await api.maindata(this.data.rid);
      this.data = applyMainData(this.data, d);
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
    if (this.#running && !document.hidden) this.#timer = setTimeout(() => this.#tick(), INTERVAL_MS);
  }
}

export const sync = new SyncStore();
