import { ApiError } from '../api/client';
import { sync } from './sync.svelte';

/** Re-runs `fetcher` every `ms` while the tab is visible. Call stop() (or return it from onMount) to end. */
export class Poll<T> {
  data = $state<T | undefined>();
  error = $state<string | null>(null);
  loaded = $state(false);

  #timer: ReturnType<typeof setTimeout> | undefined;
  #live = true;

  constructor(private fetcher: () => Promise<T>, private ms = 3000) {
    document.addEventListener('visibilitychange', this.#onVis);
    void this.#run();
  }

  stop = () => {
    this.#live = false;
    clearTimeout(this.#timer);
    document.removeEventListener('visibilitychange', this.#onVis);
  };

  refresh() {
    clearTimeout(this.#timer);
    void this.#run();
  }

  #onVis = () => (document.hidden ? clearTimeout(this.#timer) : this.refresh());

  async #run() {
    if (!this.#live) return;
    try {
      this.data = await this.fetcher();
      this.error = null;
      this.loaded = true;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        sync.refresh(); // let the main loop discover the lost session and show login
        return;
      }
      this.error = e instanceof Error ? e.message : String(e);
      this.loaded = true;
    }
    if (this.#live && !document.hidden) this.#timer = setTimeout(() => this.#run(), this.ms);
  }
}
