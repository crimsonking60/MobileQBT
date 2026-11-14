<script lang="ts">
  import { api } from '../../lib/api/client';
  import { SEP, type Feed } from '../../lib/rss';
  import { toast } from '../../lib/state/toast.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';

  let { feeds, onchange }: { feeds: Feed[]; onchange: () => void } = $props();

  let adding = $state(false);
  let newUrl = $state('');
  let newName = $state('');
  let editing = $state<Feed | null>(null);
  let editName = $state('');
  let editUrl = $state('');
  let confirmDelete = $state(false);
  let busy = $state(false);

  async function run(fn: () => Promise<unknown>, done?: string): Promise<boolean> {
    if (busy) return false;
    busy = true;
    try { await fn(); onchange(); if (done) toast.show(done); return true; }
    catch (e) { toast.show(e instanceof Error ? e.message : 'Request failed'); return false; }
    finally { busy = false; }
  }

  async function add() {
    const url = newUrl.trim();
    if (!url) return;
    // default the name to the host so the feed has something readable until its title loads
    let name = newName.trim();
    if (!name) { try { name = new URL(url).hostname; } catch { name = url; } }
    // a new feed sits empty until its first refresh, so kick one off right away
    const ok = await run(async () => { await api.rssAddFeed(url, name); await api.rssRefresh(name).catch(() => {}); }, 'Feed added');
    if (ok) { adding = false; newUrl = ''; newName = ''; }
  }

  function edit(f: Feed) {
    editing = f; editName = f.name; editUrl = f.url; confirmDelete = false;
  }

  async function save() {
    const f = editing;
    if (!f) return;
    const name = editName.trim();
    const url = editUrl.trim();
    const ok = await run(async () => {
      let path = f.path;
      if (url && url !== f.url) await api.rssSetFeedUrl(path, url);
      if (name && name !== f.name) {
        const parent = f.path.includes(SEP) ? f.path.slice(0, f.path.lastIndexOf(SEP) + 1) : '';
        await api.rssMoveItem(path, parent + name);
      }
    }, 'Feed saved');
    if (ok) editing = null;
  }

  async function remove() {
    const f = editing;
    if (f && (await run(() => api.rssRemoveItem(f.path), 'Feed removed'))) editing = null;
  }

  const input = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700';
</script>

<div class="px-4 py-3">
  <button class="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 font-medium text-white"
          onclick={() => (adding = true)}><Icon name="plus" size={18} /> Add feed</button>
</div>

{#if !feeds.length}
  <p class="p-6 text-center text-slate-500">No feeds yet.</p>
{:else}
  <ul>
    {#each feeds as f (f.path)}
      <li class="border-b border-slate-100 dark:border-slate-800/70">
        <button class="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800/60"
                onclick={() => edit(f)} aria-label="Edit feed {f.path.replaceAll(SEP, ' / ')}">
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[15px] font-medium">{f.path.replaceAll(SEP, ' / ')}</span>
            <span class="block truncate text-xs text-slate-500">{f.title && f.title !== f.name ? `${f.title} · ${f.url}` : f.url}</span>
            {#if f.hasError}<span class="text-xs text-red-500">Couldn't load this feed</span>
            {:else if f.isLoading}<span class="text-xs text-slate-500">Refreshing…</span>{/if}
          </span>
          {#if f.unread}<span class="rounded-full bg-sky-500 px-2 py-0.5 text-xs text-white">{f.unread}</span>{/if}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<Sheet open={adding} title="Add feed" onclose={() => (adding = false)}>
  <form class="space-y-3 px-3 pb-3" onsubmit={(e) => { e.preventDefault(); add(); }}>
    <input class={input} type="url" inputmode="url" placeholder="https://example.com/rss.xml" aria-label="Feed URL"
           bind:value={newUrl} />
    <input class={input} placeholder="Name (optional)" aria-label="Feed name" bind:value={newName} />
    <button class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50"
            disabled={busy || !newUrl.trim()}>Add feed</button>
  </form>
</Sheet>

<Sheet open={!!editing} title={editing?.name} onclose={() => (editing = null)}>
  {#if editing}
    <form class="space-y-3 px-3 pb-3" onsubmit={(e) => { e.preventDefault(); save(); }}>
      <label class="block text-sm text-slate-500">Name
        <input class="{input} mt-1 text-slate-900 dark:text-slate-100" bind:value={editName} aria-label="Name" />
      </label>
      <label class="block text-sm text-slate-500">URL
        <input class="{input} mt-1 text-slate-900 dark:text-slate-100" type="url" bind:value={editUrl} aria-label="URL" />
      </label>
      <div class="flex gap-2">
        <button class="flex-1 rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50" disabled={busy}>Save</button>
        <button type="button" class="rounded-lg border border-slate-300 px-4 dark:border-slate-700"
                onclick={() => { const f = editing; if (f) void run(() => api.rssRefresh(f.path), 'Refreshing'); }}>Refresh</button>
      </div>
      {#if confirmDelete}
        <div class="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/40">
          <span class="flex-1">Remove this feed and its articles?</span>
          <button type="button" class="rounded-lg px-3 py-1.5" onclick={() => (confirmDelete = false)}>Cancel</button>
          <button type="button" class="rounded-lg bg-red-600 px-3 py-1.5 text-white" onclick={remove}>Remove</button>
        </div>
      {:else}
        <button type="button" class="w-full py-2 text-sm text-red-600" onclick={() => (confirmDelete = true)}>Remove feed…</button>
      {/if}
    </form>
  {/if}
</Sheet>
