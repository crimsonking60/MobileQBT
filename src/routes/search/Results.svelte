<script lang="ts">
  import type { SearchPlugin, SearchResult } from '../../lib/api/types';
  import { api } from '../../lib/api/client';
  import { formatBytes, formatDate } from '../../lib/format';
  import {
    arrangeResults, categoriesFor, isMagnet, pluginForResult, pluginsInScope, RESULT_SORTS, siteName, type ResultSort,
  } from '../../lib/searchresults';
  import { addUi } from '../../lib/state/addui.svelte';
  import { searchStore as s } from '../../lib/state/searchstore.svelte';
  import { toast } from '../../lib/state/toast.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';

  let { plugins, onplugins }: { plugins: SearchPlugin[]; onplugins: () => void } = $props();

  const PAGE = 100;
  let sort = $state<ResultSort>('seeders');
  let desc = $state(true);
  let filter = $state('');
  let shown = $state(PAGE);
  let current = $state<SearchResult | null>(null);

  const active = $derived(pluginsInScope(plugins, s.plugin));
  const categories = $derived(categoriesFor(active));
  // a plugin or category that no longer applies falls back to the broadest choice
  $effect(() => {
    if (s.plugin !== 'enabled' && !plugins.some((p) => p.name === s.plugin)) s.plugin = 'enabled';
    if (!categories.some((c) => c.id === s.category)) s.category = 'all';
  });

  const arranged = $derived(arrangeResults(s.results, filter, sort, desc));
  const visible = $derived(arranged.slice(0, shown));
  $effect(() => { filter; sort; desc; s.ran; shown = PAGE; });

  const enabledCount = $derived(plugins.filter((p) => p.enabled).length);

  function submit(e: Event) {
    e.preventDefault();
    filter = '';
    void s.start();
  }

  async function add(r: SearchResult) {
    current = null;
    // a link that isn't a magnet may only be fetchable by the plugin, so route it through qBittorrent's search
    const plugin = isMagnet(r.fileUrl) ? undefined : pluginForResult(r, plugins);
    if (!plugin) { addUi.show(r.fileUrl); return; }
    try {
      await api.searchDownload(r.fileUrl, plugin.name);
      toast.show('Sent to qBittorrent');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Request failed');
    }
  }

  const meta = (r: SearchResult) =>
    [formatBytes(r.fileSize), siteName(r.siteUrl), r.pubDate ? formatDate(r.pubDate) : ''].filter(Boolean).join(' · ');

  const input = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700';
  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm ${on ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-700'}`;
</script>

<form class="space-y-2 px-4 py-3" onsubmit={submit}>
  <div class="flex gap-2">
    <input type="search" class="{input} min-w-0 flex-1" placeholder="Search torrent sites" aria-label="Search query"
           enterkeyhint="search" autocapitalize="none" bind:value={s.query} />
    {#if s.phase === 'running'}
      <button type="button" class="rounded-lg border border-slate-300 px-4 dark:border-slate-700"
              onclick={() => s.stop()}>Stop</button>
    {:else}
      <button class="rounded-lg bg-sky-600 px-4 font-medium text-white disabled:opacity-50"
              disabled={!s.query.trim() || !enabledCount}>Search</button>
    {/if}
  </div>
  <div class="flex gap-2">
    <select class="{input} min-w-0 flex-1" aria-label="Category" bind:value={s.category}>
      {#each categories as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
    </select>
    <select class="{input} min-w-0 flex-1" aria-label="Sites" bind:value={s.plugin}>
      <option value="enabled">All enabled sites ({enabledCount})</option>
      {#each plugins as p (p.name)}<option value={p.name}>{p.fullName}{p.enabled ? '' : ' (disabled)'}</option>{/each}
    </select>
  </div>
</form>

{#if !plugins.length}
  <div class="px-6 py-8 text-center text-slate-500">
    <p>No search plugins are installed.</p>
    <button class="mt-3 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white" onclick={onplugins}>Install a plugin</button>
    <p class="mt-4 text-sm">Search runs on the qBittorrent host and needs Python there.</p>
  </div>
{:else if !enabledCount && s.plugin === 'enabled'}
  <p class="px-6 py-8 text-center text-slate-500">All plugins are disabled. Enable one under Plugins.</p>
{:else if s.phase === 'error'}
  <p class="px-6 py-4 text-center text-red-500" role="alert">{s.error}</p>
{:else if s.phase === 'idle'}
  <p class="px-6 py-8 text-center text-slate-500">Type something to look for.</p>
{:else}
  <div class="px-4 pb-2 text-sm text-slate-500" aria-live="polite">
    {#if s.phase === 'running'}Searching for “{s.ran?.query}”… {s.results.length} found
    {:else}{s.results.length} result{s.results.length === 1 ? '' : 's'} for “{s.ran?.query}”{/if}
  </div>

  {#if s.results.length}
    <div class="space-y-2 px-4 pb-2">
      <input type="search" class={input} placeholder="Filter these results" aria-label="Filter results" bind:value={filter} />
      <div class="flex items-center gap-2 overflow-x-auto">
        {#each RESULT_SORTS as o}
          <button class={chip(sort === o.id)} onclick={() => (sort = o.id)}>{o.label}</button>
        {/each}
        <button class="shrink-0 px-2 text-sm text-sky-600 dark:text-sky-400" onclick={() => (desc = !desc)}
                aria-label={desc ? 'Descending' : 'Ascending'}>{desc ? '↓' : '↑'}</button>
      </div>
    </div>
  {/if}

  {#if s.phase === 'done' && !s.results.length}
    <p class="px-6 py-8 text-center text-slate-500">Nothing found.</p>
  {:else if s.results.length && !arranged.length}
    <p class="px-6 py-8 text-center text-slate-500">No results match the filter.</p>
  {:else}
    <ul>
      {#each visible as r, i (r.fileUrl + i)}
        <li class="border-b border-slate-100 dark:border-slate-800/70">
          <button class="flex w-full flex-col gap-1 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800/60"
                  onclick={() => (current = r)}>
            <span class="line-clamp-2 text-[15px] font-medium break-words">{r.fileName}</span>
            <span class="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span class="truncate">{meta(r)}</span>
              <span class="shrink-0 tabular-nums"><span class="text-emerald-600 dark:text-emerald-400">↑ {r.nbSeeders}</span> · ↓ {r.nbLeechers}</span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
    {#if arranged.length > shown}
      <div class="p-4">
        <button class="w-full rounded-lg border border-slate-300 py-2.5 dark:border-slate-700"
                onclick={() => (shown += PAGE)}>Show more ({arranged.length - shown} left)</button>
      </div>
    {/if}
  {/if}
{/if}

<Sheet open={!!current} title={current?.fileName} onclose={() => (current = null)}>
  {#if current}
    {@const r = current}
    <div class="space-y-3 px-3 pb-3">
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-slate-500">Size</dt><dd>{formatBytes(r.fileSize)}</dd>
        <dt class="text-slate-500">Seeders</dt><dd>{r.nbSeeders}</dd>
        <dt class="text-slate-500">Leechers</dt><dd>{r.nbLeechers}</dd>
        {#if r.pubDate}<dt class="text-slate-500">Published</dt><dd>{formatDate(r.pubDate)}</dd>{/if}
        <dt class="text-slate-500">Site</dt><dd class="break-all">{r.siteUrl || '–'}</dd>
      </dl>
      <button class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white" onclick={() => add(r)}>
        {isMagnet(r.fileUrl) ? 'Add torrent…' : 'Download'}
      </button>
      {#if r.descrLink}
        <a class="block w-full rounded-lg border border-slate-300 py-2.5 text-center dark:border-slate-700"
           href={r.descrLink} target="_blank" rel="noopener noreferrer">Open on the site</a>
      {/if}
    </div>
  {/if}
</Sheet>
