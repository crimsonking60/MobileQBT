<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../../lib/api/client';
  import type { Tracker } from '../../lib/api/types';
  import { Poll } from '../../lib/state/poll.svelte';
  import { sync } from '../../lib/state/sync.svelte';

  let { hash }: { hash: string } = $props();

  const poll = new Poll(() => api.trackers(hash));
  onMount(() => poll.stop);

  const STATUS: Record<Tracker['status'], { label: string; cls: string }> = {
    0: { label: 'Disabled', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    1: { label: 'Not contacted', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    2: { label: 'Working', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' },
    3: { label: 'Updating', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' },
    4: { label: 'Not working', cls: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200' },
  };

  // DHT / PeX / LSD show up as pseudo-trackers whose url starts with "**"
  const isPseudo = (t: Tracker) => t.url.startsWith('**');
  const count = (n: number) => (n < 0 ? '–' : n);

  async function reannounce() {
    await api.reannounce([hash]);
    poll.refresh();
    sync.refresh();
  }
</script>

<div class="flex items-center justify-between px-4 py-3">
  <span class="text-sm text-slate-500">{poll.data?.filter((t) => !isPseudo(t)).length ?? 0} trackers</span>
  <button class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700"
    onclick={reannounce}>Reannounce</button>
</div>

{#if !poll.loaded}
  <p class="p-6 text-center text-slate-500">Loading…</p>
{:else if poll.error}
  <p class="p-4 text-sm text-red-500">{poll.error}</p>
{:else}
  <ul>
    {#each poll.data ?? [] as t (t.url)}
      <li class="border-b border-slate-100 px-4 py-3 dark:border-slate-800/70">
        <div class="flex items-center justify-between gap-3">
          <span class="min-w-0 truncate text-sm {isPseudo(t) ? 'text-slate-500' : 'font-mono text-xs'}">{t.url}</span>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-xs {STATUS[t.status].cls}">{STATUS[t.status].label}</span>
        </div>
        {#if !isPseudo(t)}
          <div class="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            Seeds {count(t.num_seeds)} · Peers {count(t.num_peers)} · Leeches {count(t.num_leeches)} · Downloaded {count(t.num_downloaded)}
          </div>
        {/if}
        {#if t.msg}<div class="mt-1 text-xs break-words text-amber-600 dark:text-amber-400">{t.msg}</div>{/if}
      </li>
    {:else}
      <li class="p-6 text-center text-slate-500">No trackers.</li>
    {/each}
  </ul>
{/if}
