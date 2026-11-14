<script lang="ts">
  import Icon from '../../lib/ui/Icon.svelte';
  import { onMount } from 'svelte';
  import { api } from '../../lib/api/client';
  import type { FilePriority } from '../../lib/api/types';
  import { type FileNode, nodeProgress, PRIORITIES, priorityLabel, buildTree, visibleRows } from '../../lib/files';
  import { formatBytes, formatPercent } from '../../lib/format';
  import { Poll } from '../../lib/state/poll.svelte';
  import ProgressBar from '../../lib/ui/ProgressBar.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';

  let { hash }: { hash: string } = $props();

  const poll = new Poll(() => api.files(hash));
  onMount(() => poll.stop);

  const tree = $derived(buildTree(poll.data ?? []));
  let expanded = $state(new Set<string>());
  let seeded = false;

  // a lone top-level folder is almost always what you want opened
  $effect(() => {
    if (seeded || !tree.length) return;
    seeded = true;
    if (tree.length === 1 && tree[0].isDir) expanded = new Set([tree[0].path]);
  });

  const rows = $derived(visibleRows(tree, expanded));

  function toggle(path: string) {
    const next = new Set(expanded);
    if (!next.delete(path)) next.add(path);
    expanded = next;
  }

  let target = $state<FileNode | null>(null);

  async function setPriority(p: FilePriority) {
    const node = target;
    target = null;
    if (!node) return;
    await api.setFilePriority(hash, node.indexes, p);
    poll.refresh();
  }

  const chip = (p: FileNode['priority']) =>
    p === 0 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    : p === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    : 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200';
</script>

{#if !poll.loaded}
  <p class="p-6 text-center text-slate-500">Loading…</p>
{:else if poll.error}
  <p class="p-4 text-sm text-red-500">{poll.error}</p>
{:else if rows.length === 0}
  <p class="p-6 text-center text-slate-500">No files yet (waiting for metadata).</p>
{:else}
  <ul>
    {#each rows as { node, depth } (node.path)}
      <li class="flex items-center gap-2 border-b border-slate-100 py-2 pr-3 dark:border-slate-800/70"
          style:padding-left="{12 + depth * 16}px">
        <button class="flex min-w-0 flex-1 items-center gap-2 text-left" disabled={!node.isDir}
                onclick={() => toggle(node.path)} aria-expanded={node.isDir ? expanded.has(node.path) : undefined}>
          <span class="w-4 shrink-0 text-center text-slate-400">
            {#if node.isDir}<Icon name={expanded.has(node.path) ? 'chevron-down' : 'chevron-right'} size={16} />{/if}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[14px] {node.priority === 0 ? 'text-slate-400 line-through' : ''}">{node.name}</span>
            <span class="mt-1 flex items-center gap-2">
              <span class="flex-1"><ProgressBar value={nodeProgress(node)} tone={nodeProgress(node) >= 1 ? 'up' : 'down'} /></span>
              <span class="shrink-0 text-[11px] text-slate-500 tabular-nums">
                {formatPercent(nodeProgress(node))} · {formatBytes(node.size)}
              </span>
            </span>
          </span>
        </button>
        <button class="shrink-0 rounded-full px-2.5 py-1 text-xs {chip(node.priority)}" onclick={() => (target = node)}
                aria-label="Priority of {node.name}">{priorityLabel(node.priority)}</button>
      </li>
    {/each}
  </ul>
{/if}

<Sheet open={!!target} title={target ? `Priority · ${target.name}` : ''} onclose={() => (target = null)}>
  {#each PRIORITIES as p}
    <button class="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-[15px] active:bg-slate-100 dark:active:bg-slate-800"
            onclick={() => setPriority(p.value)}>
      {p.label}{#if target?.priority === p.value}<span class="text-sky-500"><Icon name="check" size={16} /></span>{/if}
    </button>
  {/each}
  {#if target?.isDir}<p class="px-4 pt-1 pb-3 text-xs text-slate-500">Applies to all {target.indexes.length} files inside.</p>{/if}
</Sheet>
