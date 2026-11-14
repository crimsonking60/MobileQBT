<script lang="ts">
  import { router } from '../lib/router.svelte';
  import { sync } from '../lib/state/sync.svelte';
  import { view } from '../lib/state/view.svelte';
  import { addUi } from '../lib/state/addui.svelte';
  import ActionBar from '../lib/ui/ActionBar.svelte';
  import FilterSheet from '../lib/ui/FilterSheet.svelte';
  import StatusBar from '../lib/ui/StatusBar.svelte';
  import TorrentRow from '../lib/ui/TorrentRow.svelte';

  const ROW_H = 76;
  const OVERSCAN = 6;

  let filters = $state(false);
  let scroller = $state<HTMLElement>();
  let scrollTop = $state(0);
  let height = $state(800);

  const list = $derived(view.visible);
  const start = $derived(Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN));
  const end = $derived(Math.min(list.length, Math.ceil((scrollTop + height) / ROW_H) + OVERSCAN));
  const slice = $derived(list.slice(start, end));

  const filtered = $derived(view.status !== 'all' || view.category !== null || view.tag !== null);
  const total = $derived(Object.keys(sync.data.torrents).length);

  let restored = false;
  $effect(() => {
    if (!scroller || restored) return;
    restored = true;
    scroller.scrollTop = scrollTop = view.scrollTop;
  });
</script>

<div class="relative flex h-full flex-col">
  <header class="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] dark:border-slate-800 dark:bg-slate-900">
    {#if view.selecting}
      <div class="flex items-center gap-2 px-3 py-2">
        <button class="px-2 py-1 text-xl" onclick={() => view.clearSelection()} aria-label="Cancel selection">✕</button>
        <span class="font-medium">{view.selected.size} selected</span>
        <button class="ml-auto px-2 py-1 text-sm text-sky-600 dark:text-sky-400" onclick={() => view.selectAll()}>Select all</button>
      </div>
    {:else}
      <div class="flex items-center gap-2 px-3 py-2">
        <input type="search" bind:value={view.search} placeholder="Search {total} torrents"
          class="min-w-0 flex-1 rounded-lg bg-slate-100 px-3 py-2 text-base outline-none dark:bg-slate-800" />
        <button onclick={() => (filters = true)} aria-label="Filter and sort"
          class="relative rounded-lg px-3 py-2 active:bg-slate-100 dark:active:bg-slate-800">
          ⚙︎{#if filtered}<span class="absolute top-1.5 right-1.5 size-2 rounded-full bg-sky-500"></span>{/if}
        </button>
      </div>
    {/if}
    <StatusBar />
  </header>

  {#if sync.phase === 'loading'}
    <p class="p-6 text-center text-slate-500">Loading…</p>
  {:else if sync.phase === 'error'}
    <p class="p-6 text-center text-red-500">Can't reach qBittorrent: {sync.error}</p>
  {:else if list.length === 0}
    <p class="p-6 text-center text-slate-500">{total === 0 ? 'No torrents yet.' : 'No torrents match.'}</p>
  {:else}
    <div bind:this={scroller} class="flex-1 overflow-y-auto overscroll-contain pb-20"
         onscroll={() => (scrollTop = view.scrollTop = scroller!.scrollTop)} bind:clientHeight={height}>
      <div style:height="{list.length * ROW_H}px" class="relative">
        <div style:transform="translateY({start * ROW_H}px)">
          {#each slice as t (t.hash)}
            <div style:height="{ROW_H}px">
              <TorrentRow {t} selecting={view.selecting} selected={view.selected.has(t.hash)}
                active={router.torrent === t.hash} ontap={() => router.open(t.hash)} onselect={() => view.toggle(t.hash)} />
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

{#if view.selecting}
  <ActionBar />
{:else}
  <button onclick={() => addUi.show()} aria-label="Add torrent"
    class="absolute right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 grid size-14 place-items-center rounded-full
           bg-sky-600 text-3xl leading-none text-white shadow-lg active:bg-sky-700">+</button>
{/if}
<FilterSheet open={filters} onclose={() => (filters = false)} />
</div>
