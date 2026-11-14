<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let { open, title, onclose, children }: {
    open: boolean; title?: string; onclose: () => void; children: Snippet;
  } = $props();
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onclose()} />

{#if open}
  <div class="fixed inset-0 z-40 bg-black/50" transition:fade={{ duration: 150 }}
       onclick={onclose} role="presentation"></div>
  <div class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-xl flex-col rounded-t-2xl
              bg-white pb-[env(safe-area-inset-bottom)] shadow-xl dark:bg-slate-900"
       transition:fly={{ y: 300, duration: 200 }} role="dialog" aria-modal="true" aria-label={title}>
    <div class="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700"></div>
    {#if title}<h2 class="px-5 pt-3 text-base font-semibold">{title}</h2>{/if}
    <div class="overflow-y-auto px-2 py-2">{@render children()}</div>
  </div>
{/if}
