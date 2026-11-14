<script lang="ts">
  import { api } from '../api/client';
  import { router, TABS } from '../router.svelte';
  import { resolveKey, type Action } from '../shortcuts';
  import { actionUi } from '../state/actionui.svelte';
  import { addUi } from '../state/addui.svelte';
  import { media } from '../state/media.svelte';
  import { settingsUi } from '../state/settingsui.svelte';
  import { sync } from '../state/sync.svelte';
  import { toast } from '../state/toast.svelte';
  import { view } from '../state/view.svelte';
  import ActionSheets from './ActionSheets.svelte';
  import ShortcutsHelp from './ShortcutsHelp.svelte';

  const listVisible = $derived(media.wide || !router.torrent);

  const typing = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const dialogOpen = () => !!document.querySelector('[role="dialog"]');

  /** selection wins; otherwise the cursor (which follows the open torrent) */
  function targets(): string[] {
    if (view.selecting) return view.selectedHashes;
    return view.cursor && view.cursor in sync.data.torrents ? [view.cursor] : [];
  }

  function move(delta: 1 | -1) {
    const list = view.visible;
    if (!list.length) return;
    const i = list.findIndex((t) => t.hash === view.cursor);
    view.cursor = list[Math.min(list.length - 1, Math.max(0, i < 0 ? 0 : i + delta))].hash;
  }

  async function run(fn: (h: string[]) => Promise<unknown>, done: string) {
    const h = targets();
    if (!h.length) return;
    try { await fn(h); sync.refresh(); toast.show(done); }
    catch (e) { toast.show(e instanceof Error ? e.message : 'Request failed'); }
  }

  function perform(a: Action) {
    switch (a.type) {
      case 'move': return move(a.delta);
      case 'open': if (view.cursor) router.open(view.cursor, router.tab); return;
      case 'toggle': if (view.cursor) view.toggle(view.cursor); return;
      case 'selectAll': return view.selectAll();
      case 'escape':
        if (view.selecting) view.clearSelection();
        else if (router.torrent) router.close();
        return;
      case 'search': document.querySelector<HTMLInputElement>('input[type="search"]')?.focus(); return;
      case 'start': return void run(api.start, 'Started');
      case 'stop': return void run(api.stop, 'Stopped');
      case 'delete': case 'more': case 'tags': {
        const h = targets();
        if (h.length) actionUi.show(a.type === 'delete' ? 'del' : a.type === 'tags' ? 'tagging' : 'more', h);
        return;
      }
      case 'add': return addUi.show();
      case 'settings': settingsUi.open = true; return;
      case 'help': actionUi.help = true; return;
      case 'tab': if (router.torrent) router.open(router.torrent, TABS[a.index].id); return;
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.defaultPrevented || e.isComposing || sync.phase === 'unauthenticated') return;
    if (typing(e.target) || dialogOpen()) return;
    // a focused button would otherwise also activate on Enter/Space
    if (e.target instanceof HTMLElement && e.target.closest('button, a, [role="separator"], [role="tab"]')
        && (e.key === 'Enter' || e.key === ' ')) return;
    const a = resolveKey(e, { listVisible, torrentOpen: !!router.torrent });
    if (!a) return;
    e.preventDefault();
    perform(a);
  }

  // the cursor follows whatever torrent is open, so actions apply to it
  $effect(() => { if (router.torrent) view.cursor = router.torrent; });
</script>

<svelte:window {onkeydown} />

<ActionSheets hashes={actionUi.hashes} bind:more={actionUi.more} bind:del={actionUi.del} bind:tagging={actionUi.tagging}
  ondone={() => view.clearSelection()} ondeleted={() => { if (router.torrent && actionUi.hashes.includes(router.torrent)) router.close(); }} />
<ShortcutsHelp open={actionUi.help} onclose={() => (actionUi.help = false)} />
