<script lang="ts">
  import { api } from '../../lib/api/client';
  import { formatDate } from '../../lib/format';
  import { allArticles, downloadUrl, stripHtml, type Feed, type FeedArticle } from '../../lib/rss';
  import { addUi } from '../../lib/state/addui.svelte';
  import { toast } from '../../lib/state/toast.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';

  let { feeds, onchange }: { feeds: Feed[]; onchange: () => void } = $props();

  const LIMIT = 300;
  let feedFilter = $state<string | null>(null);
  let unreadOnly = $state(false);
  let current = $state<FeedArticle | null>(null);

  const everything = $derived(allArticles(feeds));
  const shown = $derived(
    everything.filter((a) => (feedFilter === null || a.feedPath === feedFilter) && (!unreadOnly || !a.isRead)),
  );
  const unreadInScope = $derived(shown.filter((a) => !a.isRead).length);

  async function guard(fn: () => Promise<unknown>) {
    try { await fn(); onchange(); } catch (e) { toast.show(e instanceof Error ? e.message : 'Request failed'); }
  }

  function open(a: FeedArticle) {
    current = a;
    if (!a.isRead) void guard(() => api.rssMarkRead(a.feedPath, a.id));
  }

  function download(a: FeedArticle) {
    const url = downloadUrl(a);
    if (!url) return;
    current = null;
    addUi.show(url);
  }

  async function markAllRead() {
    const targets = feedFilter === null ? feeds.filter((f) => f.unread > 0) : feeds.filter((f) => f.path === feedFilter);
    await guard(() => Promise.all(targets.map((f) => api.rssMarkRead(f.path))));
    toast.show('Marked as read');
  }

  /** "feed · date[ · author]"; built as a string because the template would swallow the spaces */
  const meta = (a: FeedArticle, withAuthor = false) =>
    [a.feedName, a.time ? formatDate(a.time / 1000) : '', withAuthor ? a.author : ''].filter(Boolean).join(' · ');

  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm ${on ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-700'}`;
</script>

{#if !feeds.length}
  <p class="p-6 text-center text-slate-500">No feeds yet. Add one under Feeds.</p>
{:else}
  <div class="flex gap-2 overflow-x-auto px-3 py-2.5" role="group" aria-label="Feed filter">
    <button class={chip(feedFilter === null)} onclick={() => (feedFilter = null)}>All</button>
    {#each feeds as f (f.path)}
      <button class={chip(feedFilter === f.path)} onclick={() => (feedFilter = f.path)}>
        {f.unread ? `${f.name} (${f.unread})` : f.name}
      </button>
    {/each}
  </div>
  <div class="flex items-center justify-between px-4 pb-2 text-sm">
    <label class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <input type="checkbox" class="size-4" bind:checked={unreadOnly} /> Unread only
    </label>
    <button class="text-sky-600 disabled:opacity-40 dark:text-sky-400" disabled={!unreadInScope} onclick={markAllRead}>
      Mark all read
    </button>
  </div>

  {#if !shown.length}
    <p class="p-6 text-center text-slate-500">{unreadOnly ? 'Nothing unread.' : 'No articles.'}</p>
  {:else}
    <ul>
      {#each shown.slice(0, LIMIT) as a (a.feedPath + '\u0000' + a.id)}
        <li class="border-b border-slate-100 dark:border-slate-800/70">
          <button class="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800/60"
                  onclick={() => open(a)}>
            <span class="mt-1.5 size-2 shrink-0 rounded-full {a.isRead ? 'bg-transparent' : 'bg-sky-500'}"
                  aria-label={a.isRead ? 'Read' : 'Unread'}></span>
            <span class="min-w-0 flex-1">
              <span class="block break-words text-[15px] {a.isRead ? 'text-slate-500' : 'font-medium'}">{a.title}</span>
              <span class="mt-0.5 block truncate text-xs text-slate-500">
                {meta(a)}
              </span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
    {#if shown.length > LIMIT}<p class="p-4 text-center text-xs text-slate-500">Showing the newest {LIMIT} of {shown.length}.</p>{/if}
  {/if}
{/if}

<Sheet open={!!current} title={current?.title} onclose={() => (current = null)}>
  {#if current}
    {@const a = current}
    <div class="space-y-3 px-3 pb-3">
      <p class="text-xs text-slate-500">{meta(a, true)}</p>
      {#if stripHtml(a.description)}
        <p class="max-h-48 overflow-y-auto text-sm break-words text-slate-600 dark:text-slate-300">{stripHtml(a.description)}</p>
      {/if}
      <div class="flex gap-2">
        {#if downloadUrl(a)}
          <button class="flex-1 rounded-lg bg-sky-600 py-2.5 font-medium text-white" onclick={() => download(a)}>Download…</button>
        {:else}
          <p class="flex-1 py-2.5 text-sm text-slate-500">No torrent link in this article.</p>
        {/if}
        {#if a.link && /^https?:/i.test(a.link)}
          <a class="rounded-lg border border-slate-300 px-4 py-2.5 text-center dark:border-slate-700" href={a.link}
             target="_blank" rel="noreferrer noopener">Open page</a>
        {/if}
      </div>
    </div>
  {/if}
</Sheet>
