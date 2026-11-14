<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from './lib/router.svelte';
  import { media } from './lib/state/media.svelte';
  import { sync } from './lib/state/sync.svelte';
  import { addUi } from './lib/state/addui.svelte';
  import AddSheet from './lib/ui/AddSheet.svelte';
  import Toast from './lib/ui/Toast.svelte';
  import Detail from './routes/Detail.svelte';
  import List from './routes/List.svelte';
  import Login from './routes/Login.svelte';

  onMount(() => {
    sync.start();
    return () => sync.stop();
  });
</script>

{#if sync.phase === 'unauthenticated'}
  <Login />
{:else if media.wide}
  <div class="flex h-dvh">
    <aside class="w-[26rem] shrink-0 border-r border-slate-200 dark:border-slate-800"><List /></aside>
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

{#if sync.phase !== 'unauthenticated'}<AddSheet open={addUi.open} onclose={() => (addUi.open = false)} />{/if}
<Toast />
