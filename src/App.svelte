<script lang="ts">
  import { onMount } from 'svelte';
  import { sync } from './lib/state/sync.svelte';
  import List from './routes/List.svelte';
  import Login from './routes/Login.svelte';

  onMount(() => {
    sync.start();
    return () => sync.stop();
  });
</script>

{#if sync.phase === 'unauthenticated'}
  <Login />
{:else}
  <List />
{/if}
