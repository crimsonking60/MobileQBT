<script lang="ts">
  import { SHORTCUTS } from '../shortcuts';
  import Sheet from './Sheet.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();
</script>

<Sheet {open} title="Keyboard shortcuts" {onclose}>
  <dl class="px-4 pb-4">
    {#each SHORTCUTS as s}
      <div class="flex items-center justify-between gap-4 border-b border-slate-100 py-2 text-sm dark:border-slate-800/70">
        <dt class="text-slate-600 dark:text-slate-300">{s.label}</dt>
        <dd><kbd class="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">{s.keys}</kbd></dd>
      </div>
    {/each}
  </dl>
</Sheet>
