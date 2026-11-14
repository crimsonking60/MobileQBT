<script lang="ts">
  import Icon from './/Icon.svelte';
  import { api } from '../api/client';
  import { formatBytes, formatSpeed } from '../format';
  import { sync } from '../state/sync.svelte';

  const s = $derived(sync.data.serverState);
  const conn = $derived(s.connection_status ?? 'disconnected');
  const dot = $derived({ connected: 'bg-emerald-500', firewalled: 'bg-amber-500', disconnected: 'bg-red-500' }[conn]);

  async function toggleAlt() {
    await api.toggleAltSpeed();
    sync.refresh();
  }
</script>

<div class="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 text-xs tabular-nums
            dark:border-slate-800 dark:bg-slate-900">
  <span class="size-2 shrink-0 rounded-full {dot}" title={conn}></span>
  <span class="text-sky-600 dark:text-sky-400">↓ {formatSpeed(s.dl_info_speed ?? 0)}</span>
  <span class="text-emerald-600 dark:text-emerald-400">↑ {formatSpeed(s.up_info_speed ?? 0)}</span>
  <span class="ml-auto hidden text-slate-500 sm:inline">{formatBytes(s.free_space_on_disk ?? 0)} free</span>
  <button type="button" onclick={toggleAlt} aria-pressed={!!s.use_alt_speed_limits}
    class="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium sm:ml-0
           {s.use_alt_speed_limits ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
    <Icon name="gauge" size={14} /> {s.use_alt_speed_limits ? 'Alt speed on' : 'Alt speed'}
  </button>
</div>
