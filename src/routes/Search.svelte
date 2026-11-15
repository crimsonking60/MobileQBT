<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../lib/api/client';
  import { router } from '../lib/router.svelte';
  import { Poll } from '../lib/state/poll.svelte';
  import { searchStore } from '../lib/state/searchstore.svelte';
  import Icon from '../lib/ui/Icon.svelte';
  import Plugins from './search/Plugins.svelte';
  import Results from './search/Results.svelte';

  type Tab = 'search' | 'plugins';
  const TABS: { id: Tab; label: string }[] = [
    { id: 'search', label: 'Search' },
    { id: 'plugins', label: 'Plugins' },
  ];

  let tab = $state<Tab>('search');

  const poll = new Poll(() => api.searchPlugins(), 5000);
  onMount(() => () => { poll.stop(); searchStore.dispose(); });

  const plugins = $derived(poll.data ?? []);
</script>

<div class="flex h-full flex-col">
  <header class="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] dark:border-slate-800 dark:bg-slate-900">
    <div class="flex items-center gap-1 px-2 py-2">
      <button class="rounded-lg px-3 py-1.5 active:bg-slate-100 dark:active:bg-slate-800"
              onclick={() => router.closeSearch()} aria-label="Back to torrents"><Icon name="back" size={22} /></button>
      <h1 class="flex-1 text-base font-semibold">Search</h1>
    </div>
    <div class="flex px-2" role="tablist">
      {#each TABS as t}
        <button role="tab" aria-selected={tab === t.id} onclick={() => (tab = t.id)}
          class="border-b-2 px-3.5 py-2.5 text-sm {tab === t.id
            ? 'border-sky-500 font-medium text-sky-600 dark:text-sky-400'
            : 'border-transparent text-slate-500'}">{t.label}</button>
      {/each}
    </div>
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]" role="tabpanel">
   <div class="mx-auto w-full max-w-3xl">
    {#if !poll.loaded}
      <p class="p-6 text-center text-slate-500">Loading…</p>
    {:else if poll.error && !poll.data}
      <p class="p-6 text-center text-red-500">{poll.error}</p>
      <p class="px-6 text-center text-sm text-slate-500">Search needs Python on the qBittorrent host.</p>
    {:else if tab === 'search'}<Results {plugins} onplugins={() => (tab = 'plugins')} />
    {:else}<Plugins {plugins} onchange={() => poll.refresh()} />
    {/if}
   </div>
  </div>
</div>
