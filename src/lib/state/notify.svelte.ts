import { describe, detectEvents, type NotifyEvent } from '../notify';
import type { Torrent } from '../api/types';
import { router } from '../router.svelte';
import { toast } from './toast.svelte';

const KEY = 'mobileqbt.notify';

const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

class Notifier {
  supported = typeof Notification !== 'undefined';
  /** the user's opt-in; delivery additionally needs browser permission */
  enabled = $state(read());
  permission = $state<NotificationPermission>(typeof Notification === 'undefined' ? 'denied' : Notification.permission);

  /** must run from a user gesture so the permission prompt is allowed */
  async enable(): Promise<boolean> {
    if (!this.supported) return false;
    if (Notification.permission === 'default') this.permission = await Notification.requestPermission();
    else this.permission = Notification.permission;
    this.#save(this.permission === 'granted');
    return this.enabled;
  }
  disable() { this.#save(false); }

  #save(on: boolean) {
    this.enabled = on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* storage unavailable */ }
  }

  /** Compare two maindata snapshots and announce what changed. */
  check(prev: Record<string, Torrent>, next: Record<string, Torrent>) {
    if (!this.enabled) return;
    for (const e of detectEvents(prev, next)) void this.#deliver(e);
  }

  async #deliver(e: NotifyEvent) {
    const { title, body } = describe(e);
    // looking at the app already: an in-app toast is enough
    if (!document.hidden) { toast.show(`${title}: ${body}`, 5000); return; }
    if (this.permission !== 'granted') return;
    const opts: NotificationOptions = { body, tag: `${e.kind}:${e.hash}`, icon: 'icons/icon-192.png', data: { hash: e.hash } };
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) { await reg.showNotification(title, opts); return; }
      const n = new Notification(title, opts);
      n.onclick = () => { window.focus(); router.open(e.hash); n.close(); };
    } catch { /* notifications unavailable in this context */ }
  }
}

export const notifier = new Notifier();
