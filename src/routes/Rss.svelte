<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../lib/api/client';
  import { flattenFeeds } from '../lib/rss';
  import { router } from '../lib/router.svelte';
  import { Poll } from '../lib/state/poll.svelte';
  import Icon from '../lib/ui/Icon.svelte';
  import Articles from './rss/Articles.svelte';
  import Feeds from './rss/Feeds.svelte';
  import Rules from './rss/Rules.svelte';

  type Tab = 'articles' | 'feeds' | 'rules';
  const TABS: { id: Tab; label: string }[] = [
    { id: 'articles', label: 'Articles' },
    { id: 'feeds', label: 'Feeds' },
    { id: 'rules', label: 'Rules' },
  ];

  let tab = $state<Tab>('articles');

  const poll = new Poll(() => api.rssItems(), 5000);
  onMount(() => poll.stop);

  const feeds = $derived(poll.data ? flattenFeeds(poll.data) : []);
  const unread = $derived(feeds.reduce((n, f) => n + f.unread, 0));
</script>

<div class="flex h-full flex-col">
  <header class="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] dark:border-slate-800 dark:bg-slate-900">
    <div class="flex items-center gap-1 px-2 py-2">
      <button class="rounded-lg px-3 py-1.5 active:bg-slate-100 dark:active:bg-slate-800"
              onclick={() => router.closeRss()} aria-label="Back to torrents"><Icon name="back" size={22} /></button>
      <h1 class="flex-1 text-base font-semibold">RSS</h1>
    </div>
    <div class="flex px-2" role="tablist">
      {#each TABS as t}
        <button role="tab" aria-selected={tab === t.id} onclick={() => (tab = t.id)}
          class="border-b-2 px-3.5 py-2.5 text-sm {tab === t.id
            ? 'border-sky-500 font-medium text-sky-600 dark:text-sky-400'
            : 'border-transparent text-slate-500'}">
          {t.label}{#if t.id === 'articles' && unread}<span class="ml-1.5 rounded-full bg-sky-500 px-1.5 py-0.5 text-[11px] text-white">{unread}</span>{/if}
        </button>
      {/each}
    </div>
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]" role="tabpanel">
   <div class="mx-auto w-full max-w-3xl">
    {#if !poll.loaded}
      <p class="p-6 text-center text-slate-500">Loading…</p>
    {:else if poll.error && !poll.data}
      <p class="p-6 text-center text-red-500">{poll.error}</p>
    {:else if tab === 'articles'}<Articles {feeds} onchange={() => poll.refresh()} />
    {:else if tab === 'feeds'}<Feeds {feeds} onchange={() => poll.refresh()} />
    {:else}<Rules {feeds} />
    {/if}
   </div>
  </div>
</div>
