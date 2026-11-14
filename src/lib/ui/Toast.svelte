<script lang="ts">
  import { fly } from 'svelte/transition';
  import { toast } from '../state/toast.svelte';
</script>

{#if toast.message}
  <div class="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4"
       transition:fly={{ y: 20, duration: 150 }} role="status">
    <div class="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
      {toast.message}
    </div>
  </div>
{/if}
