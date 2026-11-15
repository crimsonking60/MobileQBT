<script lang="ts">
  import { router } from '../router.svelte';
  import { actionUi } from '../state/actionui.svelte';
  import { settingsUi } from '../state/settingsui.svelte';
  import Sheet from './Sheet.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  const row = 'w-full rounded-lg px-4 py-3 text-left text-[15px] active:bg-slate-100 dark:active:bg-slate-800';
</script>

<Sheet {open} title="Menu" {onclose}>
  <button class={row} onclick={() => { onclose(); router.openSearch(); }}>Search</button>
  <button class={row} onclick={() => { onclose(); router.openRss(); }}>RSS</button>
  <button class={row} onclick={() => { onclose(); settingsUi.open = true; }}>Settings</button>
  <button class="{row} hidden md:block" onclick={() => { onclose(); actionUi.help = true; }}>Keyboard shortcuts</button>
</Sheet>
