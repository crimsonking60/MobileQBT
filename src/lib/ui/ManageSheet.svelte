<script lang="ts">
  import { api } from '../api/client';
  import { sync } from '../state/sync.svelte';
  import { toast } from '../state/toast.svelte';
  import { view } from '../state/view.svelte';
  import Sheet from './Sheet.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  let catName = $state('');
  let catPath = $state('');
  /** category being edited; null means the form creates a new one */
  let editing = $state<string | null>(null);
  let tagName = $state('');
  let busy = $state(false);

  const categories = $derived(Object.values(sync.data.categories).sort((a, b) => a.name.localeCompare(b.name)));

  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    busy = true;
    try {
      await fn();
      sync.refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Request failed');
    } finally { busy = false; }
  }

  function startEdit(name: string, savePath: string) {
    editing = name; catName = name; catPath = savePath;
  }
  function resetForm() { editing = null; catName = ''; catPath = ''; }

  async function saveCategory() {
    const name = catName.trim();
    if (!name) return;
    await run(() => (editing ? api.editCategory(name, catPath.trim()) : api.createCategory(name, catPath.trim())));
    resetForm();
  }

  async function removeCategory(name: string) {
    if (view.category === name) view.category = null;
    await run(() => api.removeCategories([name]));
    if (editing === name) resetForm();
  }

  async function addTag() {
    const t = tagName.trim();
    if (!t) return;
    await run(() => api.createTags([t]));
    tagName = '';
  }

  async function removeTag(t: string) {
    if (view.tag === t) view.tag = null;
    await run(() => api.deleteTags([t]));
  }

  const input = 'min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700';
  const h = 'mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase';
  const iconBtn = 'rounded-lg px-3 py-2 text-sm text-slate-500 active:bg-slate-100 dark:active:bg-slate-800';
</script>

<Sheet {open} title="Categories & tags" {onclose}>
  <div class="space-y-6 px-4 pb-4">
    <section>
      <h3 class={h}>Categories</h3>
      <ul class="mb-3 divide-y divide-slate-200 dark:divide-slate-800">
        {#each categories as c (c.name)}
          <li class="flex items-center gap-1 py-1">
            <div class="min-w-0 flex-1">
              <div class="truncate text-[15px]">{c.name}</div>
              {#if c.savePath}<div class="truncate text-xs text-slate-500">{c.savePath}</div>{/if}
            </div>
            <button class={iconBtn} aria-label={`Edit ${c.name}`} onclick={() => startEdit(c.name, c.savePath)}>Edit</button>
            <button class={`${iconBtn} text-red-600`} aria-label={`Delete category ${c.name}`}
              onclick={() => removeCategory(c.name)}>Delete</button>
          </li>
        {:else}
          <li class="py-2 text-sm text-slate-500">No categories yet.</li>
        {/each}
      </ul>
      <form class="space-y-2" onsubmit={(e) => { e.preventDefault(); saveCategory(); }}>
        <input bind:value={catName} placeholder="Category name" aria-label="Category name"
          readonly={editing !== null} class={`${input} w-full ${editing !== null ? 'opacity-60' : ''}`} />
        <input bind:value={catPath} placeholder="Save path (optional)" aria-label="Category save path"
          class={`${input} w-full`} />
        <div class="flex gap-2">
          <button class="flex-1 rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50"
            disabled={busy || !catName.trim()}>{editing ? 'Save category' : 'Add category'}</button>
          {#if editing}
            <button type="button" class="rounded-lg border border-slate-300 px-4 dark:border-slate-700"
              onclick={resetForm}>Cancel</button>
          {/if}
        </div>
      </form>
    </section>

    <section>
      <h3 class={h}>Tags</h3>
      <ul class="mb-3 flex flex-wrap gap-2">
        {#each sync.data.tags as t (t)}
          <li class="flex items-center rounded-full border border-slate-300 pl-3 dark:border-slate-700">
            <span class="text-sm">{t}</span>
            <button class="px-2.5 py-1.5 text-slate-500" aria-label={`Delete tag ${t}`} onclick={() => removeTag(t)}>✕</button>
          </li>
        {:else}
          <li class="text-sm text-slate-500">No tags yet.</li>
        {/each}
      </ul>
      <form class="flex gap-2" onsubmit={(e) => { e.preventDefault(); addTag(); }}>
        <input bind:value={tagName} placeholder="New tag" aria-label="New tag" class={input} />
        <button class="rounded-lg bg-sky-600 px-4 font-medium text-white disabled:opacity-50"
          disabled={busy || !tagName.trim()}>Add</button>
      </form>
    </section>
  </div>
</Sheet>
