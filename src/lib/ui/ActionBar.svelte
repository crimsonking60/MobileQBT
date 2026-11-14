<script lang="ts">
  import { api } from '../api/client';
  import { sync } from '../state/sync.svelte';
  import { view } from '../state/view.svelte';
  import ActionSheets from './ActionSheets.svelte';

  let more = $state(false);
  let del = $state(false);
  let busy = $state(false);

  async function run(fn: (h: string[]) => Promise<unknown>) {
    const h = view.selectedHashes;
    if (!h.length || busy) return;
    busy = true;
    try { await fn(h); sync.refresh(); view.clearSelection(); }
    finally { busy = false; }
  }

  const btn = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] active:bg-slate-100 dark:active:bg-slate-800 disabled:opacity-40';
</script>

<nav class="absolute inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]
            dark:border-slate-800 dark:bg-slate-900" aria-label="Selection actions">
  <button class={btn} disabled={busy} onclick={() => run(api.start)}><span class="text-lg">▶</span>Start</button>
  <button class={btn} disabled={busy} onclick={() => run(api.stop)}><span class="text-lg">⏸</span>Stop</button>
  <button class={btn} onclick={() => (del = true)}><span class="text-lg text-red-500">🗑</span>Delete</button>
  <button class={btn} onclick={() => (more = true)}><span class="text-lg">⋯</span>More</button>
</nav>

<ActionSheets hashes={view.selectedHashes} bind:more bind:del ondone={() => view.clearSelection()} />
