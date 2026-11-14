<script lang="ts">
  let { label, value, mono = false, onclick }: {
    label: string; value: string | number; mono?: boolean; onclick?: () => void;
  } = $props();
</script>

<div class="flex items-baseline justify-between gap-4 border-b border-slate-100 px-4 py-2.5 text-sm dark:border-slate-800/70">
  <dt class="shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
  <dd class="min-w-0 text-right break-words {mono ? 'font-mono text-xs' : ''}">
    {#if onclick}<button class="text-right underline decoration-dotted" {onclick}>{value}</button>{:else}{value}{/if}
  </dd>
</div>
