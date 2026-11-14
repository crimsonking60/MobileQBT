import type { Torrent } from '../api/types';
import { matchStatus, type StatusFilter } from '../format';
import { sync } from './sync.svelte';

export type SortKey = 'added_on' | 'name' | 'progress' | 'dlspeed' | 'upspeed' | 'size' | 'ratio' | 'eta';

export const SORT_KEYS: { id: SortKey; label: string }[] = [
  { id: 'added_on', label: 'Date added' },
  { id: 'name', label: 'Name' },
  { id: 'progress', label: 'Progress' },
  { id: 'dlspeed', label: 'Download speed' },
  { id: 'upspeed', label: 'Upload speed' },
  { id: 'size', label: 'Size' },
  { id: 'ratio', label: 'Ratio' },
  { id: 'eta', label: 'ETA' },
];

/** Filter / sort / selection state for the torrent list. */
class ViewState {
  status = $state<StatusFilter>('all');
  /** null = any, '' = uncategorized */
  category = $state<string | null>(null);
  tag = $state<string | null>(null);
  search = $state('');
  sortKey = $state<SortKey>('added_on');
  sortDesc = $state(true);
  selected = $state<Set<string>>(new Set());
  /** keyboard cursor: the row shortcuts act on when nothing is selected */
  cursor = $state<string | null>(null);
  /** list scroll offset, restored when returning from a detail view */
  scrollTop = 0;

  visible = $derived.by<Torrent[]>(() => {
    const q = this.search.trim().toLowerCase();
    const list = Object.values(sync.data.torrents).filter((t) => {
      if (!matchStatus(t, this.status)) return false;
      if (this.category !== null && t.category !== this.category) return false;
      if (this.tag !== null && !t.tags.split(',').map((s) => s.trim()).includes(this.tag)) return false;
      return !q || t.name.toLowerCase().includes(q);
    });
    const k = this.sortKey;
    const dir = this.sortDesc ? -1 : 1;
    return list.sort((a, b) => {
      const x = a[k], y = b[k];
      const c = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number);
      return c * dir || a.name.localeCompare(b.name);
    });
  });

  get selecting() { return this.selected.size > 0; }

  toggle(hash: string) {
    const next = new Set(this.selected);
    if (!next.delete(hash)) next.add(hash);
    this.selected = next;
  }
  selectAll() { this.selected = new Set(this.visible.map((t) => t.hash)); }
  clearSelection() { this.selected = new Set(); }
  get selectedHashes() {
    // drop hashes that vanished (removed/filtered by the server)
    return [...this.selected].filter((h) => h in sync.data.torrents);
  }
}

export const view = new ViewState();
