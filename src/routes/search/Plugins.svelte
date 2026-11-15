<script lang="ts">
  import type { SearchPlugin } from '../../lib/api/types';
  import { api } from '../../lib/api/client';
  import { toast } from '../../lib/state/toast.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';

  let { plugins, onchange }: { plugins: SearchPlugin[]; onchange: () => void } = $props();

  let installing = $state(false);
  let sources = $state('');
  let removing = $state<SearchPlugin | null>(null);
  let busy = $state(false);

  /** Installs and updates finish on the server a moment after the request returns, so look again shortly. */
  const later = () => { onchange(); setTimeout(onchange, 1500); setTimeout(onchange, 4000); };

  async function run(fn: () => Promise<unknown>, done?: string): Promise<boolean> {
    if (busy) return false;
    busy = true;
    try { await fn(); later(); if (done) toast.show(done); return true; }
    catch (e) { toast.show(e instanceof Error ? e.message : 'Request failed'); return false; }
    finally { busy = false; }
  }

  async function install() {
    const list = sources.split(/[\n|]/).map((x) => x.trim()).filter(Boolean);
    if (!list.length) return;
    if (await run(() => api.searchInstallPlugin(list), 'Installing…')) { installing = false; sources = ''; }
  }

  async function uninstall() {
    const p = removing;
    if (p && (await run(() => api.searchUninstallPlugin([p.name]), 'Plugin removed'))) removing = null;
  }

  const input = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700';
</script>

<div class="flex gap-2 px-4 py-3">
  <button class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 font-medium text-white"
          onclick={() => (installing = true)}><Icon name="plus" size={18} /> Install plugin</button>
  <button class="rounded-lg border border-slate-300 px-4 disabled:opacity-50 dark:border-slate-700" disabled={busy || !plugins.length}
          onclick={() => run(() => api.searchUpdatePlugins(), 'Checking for updates…')}>Check for updates</button>
</div>

{#if !plugins.length}
  <p class="px-6 py-6 text-center text-slate-500">No plugins installed yet.</p>
{:else}
  <ul>
    {#each plugins as p (p.name)}
      <li class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800/70">
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[15px] font-medium {p.enabled ? '' : 'text-slate-500'}">{p.fullName}</span>
          <span class="block truncate text-xs text-slate-500">v{p.version} · {p.url}</span>
        </span>
        <input type="checkbox" role="switch" class="size-5" checked={p.enabled} aria-label="Enable {p.fullName}"
               disabled={busy} onchange={(e) => run(() => api.searchEnablePlugin([p.name], e.currentTarget.checked))} />
        <button class="rounded-lg px-2 py-1 text-sm text-red-600 dark:text-red-400" aria-label="Uninstall {p.fullName}"
                onclick={() => (removing = p)}>Remove</button>
      </li>
    {/each}
  </ul>
{/if}

<p class="px-4 py-4 text-xs text-slate-500">
  Plugins are small Python scripts that qBittorrent runs on its host. Only install ones you trust: they run with the
  same access as qBittorrent. Find them in the
  <a class="text-sky-600 underline dark:text-sky-400" href="https://github.com/qbittorrent/search-plugins/wiki/Unofficial-search-plugins"
     target="_blank" rel="noopener noreferrer">qBittorrent plugin list</a>.
</p>

<Sheet open={installing} title="Install plugin" onclose={() => (installing = false)}>
  <form class="space-y-3 px-3 pb-3" onsubmit={(e) => { e.preventDefault(); install(); }}>
    <label class="block text-sm text-slate-500">Plugin URL, or a path on the qBittorrent host
      <textarea class="{input} mt-1 text-slate-900 dark:text-slate-100" rows="3" bind:value={sources}
                placeholder="https://raw.githubusercontent.com/…/plugin.py" aria-label="Plugin sources"
                autocapitalize="none" spellcheck="false"></textarea>
    </label>
    <p class="text-xs text-slate-500">One per line. The file name must match the plugin's name.</p>
    <button class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50"
            disabled={busy || !sources.trim()}>Install</button>
  </form>
</Sheet>

<Sheet open={!!removing} title="Remove {removing?.fullName}?" onclose={() => (removing = null)}>
  <div class="flex gap-2 px-3 pb-3">
    <button class="flex-1 rounded-lg border border-slate-300 py-2.5 dark:border-slate-700" onclick={() => (removing = null)}>Cancel</button>
    <button class="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white disabled:opacity-50" disabled={busy}
            onclick={uninstall}>Remove</button>
  </div>
</Sheet>
