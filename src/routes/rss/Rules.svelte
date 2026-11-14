<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '../../lib/api/client';
  import type { RssRule } from '../../lib/api/types';
  import { blankRule, editsToDef, ruleToEdits, SEP, type Feed, type RuleEdits } from '../../lib/rss';
  import { Poll } from '../../lib/state/poll.svelte';
  import { sync } from '../../lib/state/sync.svelte';
  import { toast } from '../../lib/state/toast.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';

  let { feeds }: { feeds: Feed[] } = $props();

  const poll = new Poll(() => api.rssRules(), 8000);
  onMount(() => poll.stop);

  const rules = $derived(Object.entries(poll.data ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  const categories = $derived(Object.keys(sync.data.categories).sort());

  /** null = closed; '' = creating; otherwise the existing rule's name */
  let editingName = $state<string | null>(null);
  let name = $state('');
  let form = $state<RuleEdits>(blankRule());
  let matches = $state<Record<string, string[]> | null>(null);
  let confirmDelete = $state(false);
  let busy = $state(false);

  const isNew = $derived(editingName === '');

  function openRule(rn: string, r?: RssRule) {
    editingName = rn;
    name = rn;
    form = r ? ruleToEdits(r) : blankRule();
    matches = null;
    confirmDelete = false;
  }

  async function guard<T>(fn: () => Promise<T>, done?: string): Promise<boolean> {
    if (busy) return false;
    busy = true;
    try { await fn(); poll.refresh(); if (done) toast.show(done); return true; }
    catch (e) { toast.show(e instanceof Error ? e.message : 'Request failed'); return false; }
    finally { busy = false; }
  }

  async function save() {
    const rn = name.trim();
    if (!rn || editingName === null) return;
    const old = editingName;
    const ok = await guard(async () => {
      if (!isNew && rn !== old) await api.rssRenameRule(old, rn);
      await api.rssSetRule(rn, editsToDef(poll.data?.[old], form));
    }, 'Rule saved');
    if (ok) editingName = null;
  }

  async function remove() {
    const old = editingName;
    if (old && (await guard(() => api.rssRemoveRule(old), 'Rule removed'))) editingName = null;
  }

  /** Preview needs the rule as stored, so save first (the rule is also what would run). */
  async function preview() {
    const rn = name.trim();
    if (!rn || editingName === null || busy) return;
    const old = editingName;
    busy = true;
    try {
      if (!isNew && rn !== old) { await api.rssRenameRule(old, rn); editingName = rn; }
      await api.rssSetRule(rn, editsToDef(poll.data?.[old], form));
      if (isNew) editingName = rn;
      matches = await api.rssMatching(rn);
      poll.refresh();
    } catch (e) { toast.show(e instanceof Error ? e.message : 'Request failed'); }
    finally { busy = false; }
  }

  async function toggle(rn: string, r: RssRule) {
    await guard(() => api.rssSetRule(rn, { ...r, enabled: !r.enabled }));
  }

  const toggleFeed = (url: string, on: boolean) =>
    (form.affectedFeeds = on ? [...new Set([...form.affectedFeeds, url])] : form.affectedFeeds.filter((u) => u !== url));

  const input = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700';
  const label = 'block text-sm text-slate-500';
  const matchCount = $derived(matches ? Object.values(matches).reduce((n, l) => n + l.length, 0) : 0);
</script>

<div class="px-4 py-3">
  <button class="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 font-medium text-white"
          onclick={() => openRule('')}><Icon name="plus" size={18} /> Add rule</button>
</div>

{#if !poll.loaded}
  <p class="p-6 text-center text-slate-500">Loading…</p>
{:else if !rules.length}
  <p class="p-6 text-center text-slate-500">No download rules. A rule auto-downloads feed articles that match it.</p>
{:else}
  <ul>
    {#each rules as [rn, r] (rn)}
      <li class="flex items-center gap-2 border-b border-slate-100 pr-3 dark:border-slate-800/70">
        <button class="min-w-0 flex-1 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800/60"
                onclick={() => openRule(rn, r)} aria-label="Edit rule {rn}">
          <span class="block truncate text-[15px] font-medium {r.enabled ? '' : 'text-slate-400'}">{rn}</span>
          <span class="block truncate text-xs text-slate-500">
            {r.mustContain || (r.episodeFilter ? `Episodes ${r.episodeFilter}` : 'Matches everything')}
            · {r.affectedFeeds.length} feed{r.affectedFeeds.length === 1 ? '' : 's'}
          </span>
        </button>
        <input type="checkbox" role="switch" class="size-5" checked={r.enabled} aria-label="Enable {rn}"
               onchange={() => toggle(rn, r)} />
      </li>
    {/each}
  </ul>
{/if}

<Sheet open={editingName !== null} title={isNew ? 'New rule' : 'Edit rule'} onclose={() => (editingName = null)}>
  {#if editingName !== null}
    <form class="space-y-3 px-3 pb-3" onsubmit={(e) => { e.preventDefault(); save(); }}>
      <label class={label}>Rule name
        <input class="{input} mt-1 text-slate-900 dark:text-slate-100" bind:value={name} aria-label="Rule name" />
      </label>
      <label class="flex items-center justify-between text-[15px]">Enabled
        <input type="checkbox" class="size-5" bind:checked={form.enabled} />
      </label>
      <label class={label}>Must contain
        <input class="{input} mt-1 text-slate-900 dark:text-slate-100" bind:value={form.mustContain} aria-label="Must contain" />
      </label>
      <label class={label}>Must not contain
        <input class="{input} mt-1 text-slate-900 dark:text-slate-100" bind:value={form.mustNotContain} aria-label="Must not contain" />
      </label>
      <label class="flex items-center justify-between text-[15px]">Use regular expressions
        <input type="checkbox" class="size-5" bind:checked={form.useRegex} />
      </label>
      <label class={label}>Episode filter (e.g. 1x01-;)
        <input class="{input} mt-1 text-slate-900 dark:text-slate-100" bind:value={form.episodeFilter} aria-label="Episode filter" />
      </label>
      <label class="flex items-center justify-between text-[15px]">Smart episode filter
        <input type="checkbox" class="size-5" bind:checked={form.smartFilter} />
      </label>

      <fieldset>
        <legend class="mb-1 text-sm text-slate-500">Apply to feeds</legend>
        {#each feeds as f (f.uid)}
          <label class="flex items-center gap-3 py-1.5 text-[15px]">
            <input type="checkbox" class="size-5" checked={form.affectedFeeds.includes(f.url)}
                   onchange={(e) => toggleFeed(f.url, e.currentTarget.checked)} />
            <span class="truncate">{f.path.replaceAll(SEP, ' / ')}</span>
          </label>
        {:else}
          <p class="text-sm text-slate-500">Add a feed first.</p>
        {/each}
      </fieldset>

      <label class={label}>Category
        <select class="{input} mt-1 text-slate-900 dark:text-slate-100" bind:value={form.assignedCategory} aria-label="Category">
          <option value="">None</option>
          {#each categories as c}<option value={c}>{c}</option>{/each}
        </select>
      </label>
      <label class={label}>Save path
        <input class="{input} mt-1 text-slate-900 dark:text-slate-100" bind:value={form.savePath} placeholder="Default" aria-label="Save path" />
      </label>
      <label class="flex items-center justify-between text-[15px]">Add stopped
        <input type="checkbox" class="size-5" bind:checked={form.addPaused} />
      </label>
      <label class="flex items-center justify-between gap-3 text-[15px]">Ignore matches for (days, 0 = off)
        <input type="number" min="0" inputmode="numeric" class="{input} !w-20 text-right" bind:value={form.ignoreDays} aria-label="Ignore days" />
      </label>

      {#if matches}
        <div class="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800" aria-live="polite">
          <p class="mb-1 font-medium">{matchCount} matching article{matchCount === 1 ? '' : 's'}</p>
          {#each Object.entries(matches) as [feed, titles]}
            {#each titles as t}<p class="break-words text-slate-600 dark:text-slate-300">{t}<span class="text-xs text-slate-500"> · {feed}</span></p>{/each}
          {/each}
        </div>
      {/if}

      <div class="flex gap-2">
        <button class="flex-1 rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50"
                disabled={busy || !name.trim()}>Save</button>
        <button type="button" class="rounded-lg border border-slate-300 px-4 disabled:opacity-50 dark:border-slate-700"
                disabled={busy || !name.trim()} onclick={preview}>Preview matches</button>
      </div>
      {#if !isNew}
        {#if confirmDelete}
          <div class="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/40">
            <span class="flex-1">Delete this rule?</span>
            <button type="button" class="rounded-lg px-3 py-1.5" onclick={() => (confirmDelete = false)}>Cancel</button>
            <button type="button" class="rounded-lg bg-red-600 px-3 py-1.5 text-white" onclick={remove}>Delete</button>
          </div>
        {:else}
          <button type="button" class="w-full py-2 text-sm text-red-600" onclick={() => (confirmDelete = true)}>Delete rule…</button>
        {/if}
      {/if}
    </form>
  {/if}
</Sheet>
