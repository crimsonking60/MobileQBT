<script lang="ts">
  import { api } from '../api/client';
  import { sync } from '../state/sync.svelte';
  import { toast } from '../state/toast.svelte';
  import Sheet from './Sheet.svelte';

  /** "More" and "Delete" sheets for a set of torrents; shared by the list action bar and the detail view. */
  let { hashes, more = $bindable(false), del = $bindable(false), tagging = $bindable(false), ondone, ondeleted }: {
    hashes: string[]; more?: boolean; del?: boolean; tagging?: boolean;
    /** after any action completes */
    ondone?: () => void;
    /** after torrents were removed */
    ondeleted?: () => void;
  } = $props();

  let busy = $state(false);
  let deleteFiles = $state(false);
  let newTag = $state('');
  let newName = $state('');

  const n = $derived(hashes.length);
  const single = $derived(n === 1 ? sync.data.torrents[hashes[0]] : undefined);
  const categories = $derived(Object.keys(sync.data.categories).sort());
  const selected = $derived(hashes.map((h) => sync.data.torrents[h]).filter(Boolean));
  /** the category shared by every selected torrent, or null when they differ */
  const currentCategory = $derived(
    selected.length && selected.every((t) => t.category === selected[0].category) ? selected[0].category : null,
  );
  const hasTag = (tag: string) =>
    selected.length > 0 && selected.every((t) => t.tags.split(',').map((x) => x.trim()).includes(tag));

  async function run(fn: (h: string[]) => Promise<unknown>, removed = false) {
    if (!n || busy) return;
    busy = true;
    try {
      await fn(hashes);
      sync.refresh();
      more = false; del = false;
      ondone?.();
      if (removed) ondeleted?.();
    } finally { busy = false; }
  }

  /** Category and tag edits keep their sheet open and confirm with a toast, so the change is visible. */
  async function edit(fn: (h: string[]) => Promise<unknown>, message: string) {
    if (!n || busy) return;
    busy = true;
    try {
      await fn(hashes);
      sync.refresh();
      toast.show(message);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Request failed');
    } finally { busy = false; }
  }

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm ${on ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-700'}`;

  const row = 'w-full rounded-lg px-4 py-3 text-left text-[15px] active:bg-slate-100 dark:active:bg-slate-800';
  const input = 'min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700';
</script>

<Sheet open={more} title={single ? single.name : `${n} selected`} onclose={() => (more = false)}>
  <button class={row} onclick={() => run((h) => api.forceStart(h))}>Force start</button>
  <button class={row} onclick={() => run(api.recheck)}>Recheck</button>
  <button class={row} onclick={() => run(api.reannounce)}>Reannounce</button>
  <button class={row} onclick={() => run((h) => api.priority(h, 'topPrio'))}>Move to top of queue</button>
  <button class={row} onclick={() => run((h) => api.priority(h, 'bottomPrio'))}>Move to bottom of queue</button>

  {#if single}
    <h3 class="px-4 pt-3 pb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">Rename</h3>
    <form class="flex gap-2 px-4 pb-2"
      onsubmit={(e) => { e.preventDefault(); const v = newName.trim(); if (v) run((h) => api.rename(h[0], v)); }}>
      <input bind:value={newName} placeholder={single.name} class={input} />
      <button class="rounded-lg bg-sky-600 px-4 text-white">Save</button>
    </form>
  {/if}

  <button class={row} onclick={() => { more = false; tagging = true; }}>Category &amp; tags…</button>
</Sheet>

<Sheet open={tagging} title="Category & tags" onclose={() => (tagging = false)}>
  <div class="space-y-5 px-4 pb-4">
    <section>
      <h3 class="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Category</h3>
      <div class="flex flex-wrap gap-2">
        <button class={chip(currentCategory === '')} aria-pressed={currentCategory === ''}
          onclick={() => edit((h) => api.setCategory(h, ''), 'Category cleared')}>None</button>
        {#each categories as c}
          <button class={chip(currentCategory === c)} aria-pressed={currentCategory === c}
            onclick={() => edit((h) => api.setCategory(h, c), `Category: ${c}`)}>{c}</button>
        {/each}
      </div>
      {#if !categories.length}<p class="mt-2 text-sm text-slate-500">No categories yet. Create one under Filter → Manage.</p>{/if}
    </section>
    <section>
      <h3 class="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Tags</h3>
      <div class="mb-3 flex flex-wrap gap-2">
        {#each sync.data.tags as t}
          <button class={chip(hasTag(t))} aria-pressed={hasTag(t)}
            onclick={() => hasTag(t) ? edit((h) => api.removeTags(h, [t]), `Removed tag ${t}`) : edit((h) => api.addTags(h, [t]), `Added tag ${t}`)}>{t}</button>
        {/each}
      </div>
      <form class="flex gap-2"
        onsubmit={(e) => { e.preventDefault(); const t = newTag.trim(); if (t) { edit((h) => api.addTags(h, [t]), `Added tag ${t}`); newTag = ''; } }}>
        <input bind:value={newTag} placeholder="New tag" aria-label="New tag" class={input} />
        <button class="rounded-lg bg-sky-600 px-4 text-white">Add</button>
      </form>
    </section>
    <button class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white" onclick={() => (tagging = false)}>Done</button>
  </div>
</Sheet>

<Sheet open={del} title="Delete {n} torrent{n === 1 ? '' : 's'}?" onclose={() => (del = false)}>
  <label class="flex items-center gap-3 px-4 py-3 text-[15px]">
    <input type="checkbox" bind:checked={deleteFiles} class="size-5" /> Also delete downloaded files
  </label>
  <div class="flex gap-2 px-4 pt-1 pb-3">
    <button class="flex-1 rounded-lg border border-slate-300 py-2.5 dark:border-slate-700" onclick={() => (del = false)}>Cancel</button>
    <button class="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white"
      onclick={() => run((h) => api.remove(h, deleteFiles), true)}>Delete</button>
  </div>
</Sheet>
