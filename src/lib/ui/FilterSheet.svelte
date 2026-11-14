<script lang="ts">
  import { STATUS_FILTERS } from '../format';
  import { sync } from '../state/sync.svelte';
  import { SORT_KEYS, view } from '../state/view.svelte';
  import ManageSheet from './ManageSheet.svelte';
  import Sheet from './Sheet.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  let manage = $state(false);
  const categories = $derived(Object.keys(sync.data.categories).sort());
  const counts = $derived.by(() => {
    const c = { uncategorized: 0 } as Record<string, number>;
    for (const t of Object.values(sync.data.torrents)) {
      if (!t.category) c.uncategorized++;
      else c[t.category] = (c[t.category] ?? 0) + 1;
    }
    return c;
  });

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm ${on
      ? 'border-sky-500 bg-sky-500 text-white'
      : 'border-slate-300 dark:border-slate-700'}`;
</script>

<Sheet {open} title="Filter & sort" {onclose}>
  <div class="space-y-5 px-3 pb-4">
    <section>
      <h3 class="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Status</h3>
      <div class="flex flex-wrap gap-2">
        {#each STATUS_FILTERS as f}
          <button class={chip(view.status === f.id)} onclick={() => (view.status = f.id)}>{f.label}</button>
        {/each}
      </div>
    </section>

    <section>
      <h3 class="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Category</h3>
      <div class="flex flex-wrap gap-2">
        <button class={chip(view.category === null)} onclick={() => (view.category = null)}>Any</button>
        <button class={chip(view.category === '')} onclick={() => (view.category = '')}>
          Uncategorized ({counts.uncategorized})
        </button>
        {#each categories as c}
          <button class={chip(view.category === c)} onclick={() => (view.category = c)}>{c} ({counts[c] ?? 0})</button>
        {/each}
      </div>
    </section>

    {#if sync.data.tags.length}
      <section>
        <h3 class="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Tag</h3>
        <div class="flex flex-wrap gap-2">
          <button class={chip(view.tag === null)} onclick={() => (view.tag = null)}>Any</button>
          {#each sync.data.tags as t}
            <button class={chip(view.tag === t)} onclick={() => (view.tag = t)}>{t}</button>
          {/each}
        </div>
      </section>
    {/if}

    <section>
      <h3 class="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Sort by</h3>
      <div class="flex flex-wrap gap-2">
        {#each SORT_KEYS as k}
          <button class={chip(view.sortKey === k.id)} onclick={() => (view.sortKey = k.id)}>{k.label}</button>
        {/each}
      </div>
      <button class="mt-3 text-sm text-sky-600 dark:text-sky-400" onclick={() => (view.sortDesc = !view.sortDesc)}>
        {view.sortDesc ? '↓ Descending' : '↑ Ascending'}
      </button>
    </section>

    <button class="text-sm text-sky-600 dark:text-sky-400" onclick={() => (manage = true)}>
      Manage categories & tags…
    </button>

    <button class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white" onclick={onclose}>Done</button>
  </div>
</Sheet>

<ManageSheet open={manage} onclose={() => (manage = false)} />
