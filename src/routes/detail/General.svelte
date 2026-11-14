<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../../lib/api/client';
  import { formatBytes, formatDate, formatDuration, formatEta, formatSpeed } from '../../lib/format';
  import { Poll } from '../../lib/state/poll.svelte';
  import { sync } from '../../lib/state/sync.svelte';
  import Kv from '../../lib/ui/Kv.svelte';

  let { hash }: { hash: string } = $props();

  const poll = new Poll(() => api.properties(hash));
  onMount(() => poll.stop);

  const t = $derived(sync.data.torrents[hash]);
  const p = $derived(poll.data);

  let copied = $state(false);
  async function copyHash() {
    try { await navigator.clipboard.writeText(hash); copied = true; setTimeout(() => (copied = false), 1500); } catch { /* clipboard unavailable */ }
  }

  const h = 'px-4 pt-5 pb-1 text-xs font-medium tracking-wide text-slate-500 uppercase';
</script>

{#if t}
  <dl>
    <h3 class={h}>Transfer</h3>
    <Kv label="Downloaded" value={formatBytes(p?.total_downloaded ?? t.downloaded)} />
    <Kv label="Uploaded" value={formatBytes(p?.total_uploaded ?? t.uploaded)} />
    <Kv label="Share ratio" value={(p?.share_ratio ?? t.ratio).toFixed(2)} />
    <Kv label="ETA" value={formatEta(t.eta)} />
    <Kv label="Seeds" value="{t.num_seeds}{p ? ` (${p.seeds_total} in swarm)` : ''}" />
    <Kv label="Peers" value="{t.num_leechs}{p ? ` (${p.peers_total} in swarm)` : ''}" />
    {#if p}
      <Kv label="Connections" value="{p.nb_connections} / {p.nb_connections_limit}" />
      <Kv label="Avg. download" value={p.dl_speed_avg >= 0 ? formatSpeed(p.dl_speed_avg) : '–'} />
      <Kv label="Avg. upload" value={p.up_speed_avg >= 0 ? formatSpeed(p.up_speed_avg) : '–'} />
      <Kv label="Wasted" value={formatBytes(p.total_wasted)} />
    {/if}

    <h3 class={h}>Torrent</h3>
    <Kv label="Save path" value={p?.save_path ?? t.save_path} mono />
    <Kv label="Size" value={formatBytes(t.size)} />
    <Kv label="Category" value={t.category || '–'} />
    <Kv label="Tags" value={t.tags || '–'} />
    <Kv label="Tracker" value={t.tracker || '–'} mono />
    {#if p}
      <Kv label="Pieces" value="{p.pieces_have} / {p.pieces_num} × {formatBytes(p.piece_size)}" />
      <Kv label="Private" value={p.is_private ? 'Yes' : 'No'} />
    {/if}
    <Kv label="Info hash" value={copied ? 'Copied!' : hash} mono onclick={copyHash} />

    {#if p}
      <h3 class={h}>Times</h3>
      <Kv label="Added" value={formatDate(p.addition_date)} />
      <Kv label="Completed" value={formatDate(p.completion_date)} />
      <Kv label="Active for" value={formatDuration(p.time_elapsed)} />
      <Kv label="Seeding for" value={formatDuration(p.seeding_time)} />
      <Kv label="Last seen complete" value={formatDate(p.last_seen)} />

      {#if p.created_by || p.creation_date > 0 || p.comment}
        <h3 class={h}>Origin</h3>
        {#if p.created_by}<Kv label="Created by" value={p.created_by} />{/if}
        {#if p.creation_date > 0}<Kv label="Created on" value={formatDate(p.creation_date)} />{/if}
        {#if p.comment}<Kv label="Comment" value={p.comment} />{/if}
      {/if}
    {:else if poll.error}
      <p class="p-4 text-sm text-red-500">{poll.error}</p>
    {/if}
  </dl>
{/if}
