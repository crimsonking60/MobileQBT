<script lang="ts">
  import { router } from '../router.svelte';
  import { actionUi } from '../state/actionui.svelte';
  import { settingsUi } from '../state/settingsui.svelte';
  import { formatBytes } from '../format';
  import { sync } from '../state/sync.svelte';
  import Sheet from './Sheet.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  const s = $derived(sync.data.serverState);

  const row = 'w-full rounded-lg px-4 py-3 text-left text-[15px] active:bg-slate-100 dark:active:bg-slate-800';
</script>

<Sheet {open} title="Menu" {onclose}>
  <button class={row} onclick={() => { onclose(); router.openSearch(); }}>Search</button>
  <button class={row} onclick={() => { onclose(); router.openRss(); }}>RSS</button>
  <button class={row} onclick={() => { onclose(); settingsUi.open = true; }}>Settings</button>
  <button class="{row} hidden md:block" onclick={() => { onclose(); actionUi.help = true; }}>Keyboard shortcuts</button>
  <dl class="mt-2 grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 border-t border-slate-200 px-4 pt-3 text-sm tabular-nums dark:border-slate-800">
    <dt></dt><dd class="text-xs text-slate-500">Downloaded</dd><dd class="text-xs text-slate-500">Uploaded</dd>
    <dt class="text-slate-500">Session</dt>
    <dd class="text-sky-600 dark:text-sky-400">{formatBytes(s.dl_info_data ?? 0)}</dd>
    <dd class="text-emerald-600 dark:text-emerald-400">{formatBytes(s.up_info_data ?? 0)}</dd>
    {#if s.alltime_dl !== undefined}
      <dt class="text-slate-500">All time</dt>
      <dd>{formatBytes(s.alltime_dl)}</dd>
      <dd>{formatBytes(s.alltime_ul ?? 0)}</dd>
      <dt class="text-slate-500">Ratio</dt>
      <dd class="col-span-2">{s.global_ratio ?? '–'}</dd>
    {/if}
  </dl>
</Sheet>
