<script lang="ts">
  import { api } from '../api/client';
  import { sync } from '../state/sync.svelte';
  import { view } from '../state/view.svelte';
  import Sheet from './Sheet.svelte';

  let more = $state(false);
  let confirmDelete = $state(false);
  let deleteFiles = $state(false);
  let busy = $state(false);

  const n = $derived(view.selected.size);
  const categories = $derived(Object.keys(sync.data.categories).sort());

  async function run(fn: (h: string[]) => Promise<unknown>, keep = false) {
    const h = view.selectedHashes;
    if (!h.length || busy) return;
    busy = true;
    try { await fn(h); sync.refresh(); if (!keep) view.clearSelection(); }
    finally { busy = false; more = false; confirmDelete = false; }
  }

  let newTag = $state('');
  const btn = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] active:bg-slate-100 dark:active:bg-slate-800 disabled:opacity-40';
  const row = 'w-full rounded-lg px-4 py-3 text-left text-[15px] active:bg-slate-100 dark:active:bg-slate-800';
</script>

<nav class="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]
            dark:border-slate-800 dark:bg-slate-900" aria-label="Selection actions">
  <button class={btn} disabled={busy} onclick={() => run(api.start)}><span class="text-lg">▶</span>Start</button>
  <button class={btn} disabled={busy} onclick={() => run(api.stop)}><span class="text-lg">⏸</span>Stop</button>
  <button class={btn} disabled={busy} onclick={() => (confirmDelete = true)}>
    <span class="text-lg text-red-500">🗑</span>Delete</button>
  <button class={btn} disabled={busy} onclick={() => (more = true)}><span class="text-lg">⋯</span>More</button>
</nav>

<Sheet open={more} title="{n} selected" onclose={() => (more = false)}>
  <button class={row} onclick={() => run((h) => api.forceStart(h))}>Force start</button>
  <button class={row} onclick={() => run(api.recheck)}>Recheck</button>
  <button class={row} onclick={() => run(api.reannounce)}>Reannounce</button>
  <button class={row} onclick={() => run((h) => api.priority(h, 'topPrio'))}>Move to top of queue</button>
  <button class={row} onclick={() => run((h) => api.priority(h, 'bottomPrio'))}>Move to bottom of queue</button>
  <h3 class="px-4 pt-3 pb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">Set category</h3>
  <button class={row} onclick={() => run((h) => api.setCategory(h, ''))}>None</button>
  {#each categories as c}
    <button class={row} onclick={() => run((h) => api.setCategory(h, c))}>{c}</button>
  {/each}
  <h3 class="px-4 pt-3 pb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">Add tag</h3>
  <form class="flex gap-2 px-4 pb-2" onsubmit={(e) => { e.preventDefault(); const t = newTag.trim(); if (t) { run((h) => api.addTags(h, [t])); newTag = ''; } }}>
    <input bind:value={newTag} placeholder="tag" class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700" />
    <button class="rounded-lg bg-sky-600 px-4 text-white">Add</button>
  </form>
</Sheet>

<Sheet open={confirmDelete} title="Delete {n} torrent{n === 1 ? '' : 's'}?" onclose={() => (confirmDelete = false)}>
  <label class="flex items-center gap-3 px-4 py-3 text-[15px]">
    <input type="checkbox" bind:checked={deleteFiles} class="size-5" /> Also delete downloaded files
  </label>
  <div class="flex gap-2 px-4 pt-1 pb-3">
    <button class="flex-1 rounded-lg border border-slate-300 py-2.5 dark:border-slate-700" onclick={() => (confirmDelete = false)}>Cancel</button>
    <button class="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white" onclick={() => run((h) => api.remove(h, deleteFiles))}>Delete</button>
  </div>
</Sheet>
