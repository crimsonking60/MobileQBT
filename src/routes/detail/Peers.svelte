<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../../lib/api/client';
  import { formatBytes, formatPercent, formatSpeed } from '../../lib/format';
  import { flagEmoji, peerKey, sortPeers } from '../../lib/peers';
  import { Poll } from '../../lib/state/poll.svelte';

  let { hash }: { hash: string } = $props();

  const poll = new Poll(() => api.peers(hash), 2500);
  onMount(() => poll.stop);

  const peers = $derived(sortPeers(Object.values(poll.data?.peers ?? {})));
</script>

{#if !poll.loaded}
  <p class="p-6 text-center text-slate-500">Loading…</p>
{:else if poll.error}
  <p class="p-4 text-sm text-red-500">{poll.error}</p>
{:else}
  <p class="px-4 py-3 text-sm text-slate-500">{peers.length} connected peer{peers.length === 1 ? '' : 's'}</p>
  <ul>
    {#each peers as p (peerKey(p))}
      <li class="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800/70">
        <div class="flex items-center justify-between gap-3">
          <span class="min-w-0 truncate font-mono text-xs">
            <span title={p.country}>{flagEmoji(p.country_code)}</span> {peerKey(p)}
          </span>
          <span class="shrink-0 text-xs text-slate-500 tabular-nums">{formatPercent(p.progress)}</span>
        </div>
        <div class="mt-0.5 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span class="min-w-0 truncate">{p.client || 'Unknown client'} · {p.connection}{p.flags ? ` · ${p.flags}` : ''}</span>
          <span class="shrink-0 tabular-nums">
            <span class="text-sky-700 dark:text-sky-400">↓ {formatSpeed(p.dl_speed)}</span>
            <span class="text-emerald-700 dark:text-emerald-400">↑ {formatSpeed(p.up_speed)}</span>
          </span>
        </div>
        <div class="mt-0.5 text-[11px] text-slate-400 tabular-nums">
          got {formatBytes(p.downloaded)} · sent {formatBytes(p.uploaded)}
        </div>
      </li>
    {:else}
      <li class="p-6 text-center text-slate-500">No connected peers.</li>
    {/each}
  </ul>
{/if}
