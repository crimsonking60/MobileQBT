<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from './lib/router.svelte';
  import { media } from './lib/state/media.svelte';
  import { sync } from './lib/state/sync.svelte';
  import { addUi } from './lib/state/addui.svelte';
  import { settingsUi } from './lib/state/settingsui.svelte';
  import SettingsSheet from './lib/ui/SettingsSheet.svelte';
  import { clampSplit, split } from './lib/state/split.svelte';
  import Splitter from './lib/ui/Splitter.svelte';
  import Shortcuts from './lib/ui/Shortcuts.svelte';
  import AddSheet from './lib/ui/AddSheet.svelte';
  import Toast from './lib/ui/Toast.svelte';
  import Detail from './routes/Detail.svelte';
  import List from './routes/List.svelte';
  import Login from './routes/Login.svelte';
  import Rss from './routes/Rss.svelte';
  import Search from './routes/Search.svelte';

  let innerWidth = $state(typeof window === 'undefined' ? 1024 : window.innerWidth);

  onMount(() => {
    sync.start();
    return () => sync.stop();
  });
</script>

<svelte:window bind:innerWidth />

{#if sync.phase === 'unauthenticated'}
  <Login />
{:else if router.rss}
  <div class="h-dvh"><Rss /></div>
{:else if router.search}
  <div class="h-dvh"><Search /></div>
{:else if media.wide}
  <div class="flex h-dvh">
    <aside class="shrink-0" style:width="{clampSplit(split.width, innerWidth)}px"><List /></aside>
    <Splitter />
    <section class="min-w-0 flex-1">
      {#if router.torrent}
        {#key router.torrent}<Detail hash={router.torrent} />{/key}
      {:else}
        <p class="grid h-full place-items-center text-slate-500">Select a torrent</p>
      {/if}
    </section>
  </div>
{:else if router.torrent}
  <div class="h-dvh">{#key router.torrent}<Detail hash={router.torrent} />{/key}</div>
{:else}
  <div class="h-dvh"><List /></div>
{/if}

{#if sync.phase !== 'unauthenticated'}
  <AddSheet open={addUi.open} onclose={() => (addUi.open = false)} />
  <Shortcuts />
  <SettingsSheet open={settingsUi.open} onclose={() => (settingsUi.open = false)} />
{/if}
<Toast />
