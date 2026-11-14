<script lang="ts">
  import { untrack } from 'svelte';
  import { api } from '../lib/api/client';
  import { formatPercent, formatSpeed, stateInfo } from '../lib/format';
  import { router, TABS } from '../lib/router.svelte';
  import { SpeedHistory } from '../lib/state/history.svelte';
  import { sync } from '../lib/state/sync.svelte';
  import ActionSheets from '../lib/ui/ActionSheets.svelte';
  import ProgressBar from '../lib/ui/ProgressBar.svelte';
  import Files from './detail/Files.svelte';
  import General from './detail/General.svelte';
  import Peers from './detail/Peers.svelte';
  import Speed from './detail/Speed.svelte';
  import Trackers from './detail/Trackers.svelte';

  let { hash }: { hash: string } = $props();

  const t = $derived(sync.data.torrents[hash]);
  const info = $derived(t ? stateInfo(t.state) : undefined);
  const stopped = $derived(t?.state === 'stoppedDL' || t?.state === 'stoppedUP');

  // one sample per sync tick; untrack so writing samples doesn't retrigger this effect
  const history = new SpeedHistory();
  $effect(() => {
    const cur = sync.data.torrents[hash];
    if (cur) untrack(() => history.push(cur.dlspeed, cur.upspeed));
  });

  let more = $state(false);
  let del = $state(false);

  async function toggleRun() {
    await (stopped ? api.start([hash]) : api.stop([hash]));
    sync.refresh();
  }
</script>

<div class="flex h-full min-h-0 flex-col">
  <header class="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] dark:border-slate-800 dark:bg-slate-900">
    <div class="flex items-center gap-1 px-2 py-2">
      <button class="rounded-lg px-3 py-1.5 text-xl active:bg-slate-100 dark:active:bg-slate-800"
              onclick={() => router.close()} aria-label="Back to list">‹</button>
      <h1 class="min-w-0 flex-1 truncate text-base font-semibold">{t?.name ?? 'Torrent'}</h1>
      {#if t}
        <button class="rounded-lg px-3 py-1.5 text-lg active:bg-slate-100 dark:active:bg-slate-800"
                onclick={toggleRun} aria-label={stopped ? 'Start' : 'Stop'}>{stopped ? '▶' : '⏸'}</button>
        <button class="rounded-lg px-3 py-1.5 text-lg active:bg-slate-100 dark:active:bg-slate-800"
                onclick={() => (del = true)} aria-label="Delete">🗑</button>
        <button class="rounded-lg px-3 py-1.5 text-lg active:bg-slate-100 dark:active:bg-slate-800"
                onclick={() => (more = true)} aria-label="More actions">⋯</button>
      {/if}
    </div>

    {#if t && info}
      <div class="space-y-1.5 px-4 pb-2.5">
        <ProgressBar value={t.progress} tone={info.tone} />
        <div class="flex justify-between text-xs text-slate-500 tabular-nums dark:text-slate-400">
          <span>{info.label} · {formatPercent(t.progress)}</span>
          <span>↓ {formatSpeed(t.dlspeed)} ↑ {formatSpeed(t.upspeed)}</span>
        </div>
      </div>
    {/if}

    <div class="flex overflow-x-auto px-2" role="tablist">
      {#each TABS as tab}
        <button role="tab" aria-selected={router.tab === tab.id}
          onclick={() => router.open(hash, tab.id, true)}
          class="shrink-0 border-b-2 px-3.5 py-2.5 text-sm {router.tab === tab.id
            ? 'border-sky-500 font-medium text-sky-600 dark:text-sky-400'
            : 'border-transparent text-slate-500'}">{tab.label}</button>
      {/each}
    </div>
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]" role="tabpanel">
    {#if !t}
      <p class="p-6 text-center text-slate-500">
        {sync.phase === 'ready' ? 'This torrent no longer exists.' : 'Loading…'}
      </p>
    {:else if router.tab === 'general'}<General {hash} />
    {:else if router.tab === 'trackers'}<Trackers {hash} />
    {:else if router.tab === 'peers'}<Peers {hash} />
    {:else if router.tab === 'files'}<Files {hash} />
    {:else}<Speed {history} />
    {/if}
  </div>
</div>

<ActionSheets hashes={t ? [hash] : []} bind:more bind:del ondeleted={() => router.close()} />
