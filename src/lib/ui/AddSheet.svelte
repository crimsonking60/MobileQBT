<script lang="ts">
  import Icon from './/Icon.svelte';
  import { api } from '../api/client';
  import { parseUrls } from '../add';
  import { addUi } from '../state/addui.svelte';
  import { sync } from '../state/sync.svelte';
  import { toast } from '../state/toast.svelte';
  import Sheet from './Sheet.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  const LAST_CATEGORY = 'mobileqbt.lastCategory';
  const stored = () => { try { return localStorage.getItem(LAST_CATEGORY) ?? ''; } catch { return ''; } };

  let files = $state<File[]>([]);
  let category = $state(stored());
  let savepath = $state('');
  let tags = $state('');
  let startNow = $state(true);
  let sequential = $state(false);
  let firstLast = $state(false);
  let busy = $state(false);
  let error = $state('');
  let defaultPath = $state('');

  const categories = $derived(Object.keys(sync.data.categories).sort());
  const count = $derived(parseUrls(addUi.urls).length + files.length);

  // fetch the default save path once, to show as the placeholder
  $effect(() => {
    if (open && !defaultPath) api.defaultSavePath().then((p) => (defaultPath = p.trim())).catch(() => {});
  });

  function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    files = [...files, ...Array.from(input.files ?? [])];
    input.value = '';
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!count || busy) return;
    busy = true; error = '';
    try {
      const r = await api.add({
        urls: parseUrls(addUi.urls).join('\n') || undefined,
        files,
        savepath: savepath.trim() || undefined,
        category: category || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean).join(',') || undefined,
        stopped: !startNow,
        sequentialDownload: sequential,
        firstLastPiecePrio: firstLast,
      });
      try { localStorage.setItem(LAST_CATEGORY, category); } catch { /* storage unavailable */ }
      toast.show(r.failed ? `Added ${r.added}, ${r.failed} failed` : `Added ${r.added} torrent${r.added === 1 ? '' : 's'}`);
      addUi.urls = ''; files = []; tags = '';
      sync.refresh();
      onclose();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally { busy = false; }
  }

  const field = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-base dark:border-slate-700';
  const label = 'mb-1 block text-xs font-medium tracking-wide text-slate-500 uppercase';
</script>

<Sheet {open} title="Add torrents" {onclose}>
  <form class="space-y-4 px-3 pb-4" onsubmit={submit}>
    <div>
      <label class={label} for="add-urls">Magnet links or URLs (one per line)</label>
      <textarea id="add-urls" bind:value={addUi.urls} rows="3" class="{field} font-mono text-sm" autocapitalize="none" spellcheck="false"
                placeholder="magnet:?xt=urn:btih:…"></textarea>
    </div>

    <div>
      <span class={label}>.torrent files</span>
      <label class="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 active:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:active:bg-slate-800">
        Choose files…
        <input type="file" accept=".torrent,application/x-bittorrent" multiple class="sr-only" onchange={pick} aria-label="Torrent files" />
      </label>
      {#if files.length}
        <ul class="mt-2 space-y-1 text-sm">
          {#each files as f, i (f.name + i)}
            <li class="flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
              <span class="truncate">{f.name}</span>
              <button type="button" class="px-1 text-slate-500" aria-label="Remove {f.name}"
                      onclick={() => (files = files.filter((_, j) => j !== i))}><Icon name="close" size={16} /></button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class={label} for="add-cat">Category</label>
        <select id="add-cat" bind:value={category} class={field}>
          <option value="">None</option>
          {#each categories as c}<option value={c}>{c}</option>{/each}
        </select>
      </div>
      <div>
        <label class={label} for="add-tags">Tags</label>
        <input id="add-tags" bind:value={tags} class={field} placeholder="a, b" autocapitalize="none" />
      </div>
    </div>

    <div>
      <label class={label} for="add-path">Save path</label>
      <input id="add-path" bind:value={savepath} class="{field} font-mono text-sm" placeholder={defaultPath || 'Default'} autocapitalize="none" spellcheck="false" />
    </div>

    <div class="space-y-2.5 text-[15px]">
      <label class="flex items-center gap-3"><input type="checkbox" bind:checked={startNow} class="size-5" /> Start torrent</label>
      <label class="flex items-center gap-3"><input type="checkbox" bind:checked={sequential} class="size-5" /> Download in sequential order</label>
      <label class="flex items-center gap-3"><input type="checkbox" bind:checked={firstLast} class="size-5" /> Download first and last pieces first</label>
    </div>

    {#if error}<p class="text-sm text-red-500" role="alert">{error}</p>{/if}

    <button disabled={!count || busy} class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50">
      {busy ? 'Adding…' : count > 1 ? `Add ${count} torrents` : 'Add torrent'}
    </button>
  </form>
</Sheet>
