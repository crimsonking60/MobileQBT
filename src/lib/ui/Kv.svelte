<script lang="ts">
  import Icon from './Icon.svelte';

  let { label, value, mono = false, edit = false, onclick }: {
    label: string; value: string | number; mono?: boolean;
    /** the row opens an editor: render it as a tappable row with a chevron */
    edit?: boolean; onclick?: () => void;
  } = $props();
</script>

<div class="flex items-baseline justify-between gap-4 border-b border-slate-100 px-4 py-2.5 text-sm dark:border-slate-800/70">
  <dt class="shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
  <dd class="min-w-0 text-right break-words {mono ? 'font-mono text-xs' : ''}">
    {#if onclick && edit}
      <button class="-my-2.5 -mr-2 inline-flex items-center gap-1 py-2.5 pr-2 pl-3 text-sky-600 dark:text-sky-400" {onclick}
        aria-label="Edit {label.toLowerCase()}">{value}<Icon name="chevron-right" size={16} /></button>
    {:else if onclick}<button class="text-right underline decoration-dotted" {onclick}>{value}</button>{:else}{value}{/if}
  </dd>
</div>
