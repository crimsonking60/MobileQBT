/** Sheets opened from keyboard shortcuts, targeting a fixed set of torrents. */
class ActionUi {
  hashes = $state<string[]>([]);
  more = $state(false);
  del = $state(false);
  tagging = $state(false);
  help = $state(false);

  show(kind: 'more' | 'del' | 'tagging', hashes: string[]) {
    this.hashes = hashes;
    this[kind] = true;
  }
}
export const actionUi = new ActionUi();
