<script lang="ts">
  import { api } from '../api/client';
  import {
    bytesToKiB, diffPrefs, fromTime, kibToBytes, pickPrefs, SCHEDULER_DAYS, toTime, type Prefs,
  } from '../prefs';
  import { sync } from '../state/sync.svelte';
  import { toast } from '../state/toast.svelte';
  import Sheet from './Sheet.svelte';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  let orig = $state<Prefs | null>(null);
  let cur = $state<Prefs | null>(null);
  let error = $state('');
  let busy = $state(false);

  // reload every time the sheet opens so we never edit stale values
  $effect(() => {
    if (!open) return;
    orig = cur = null; error = '';
    api.preferences().then((raw) => {
      orig = pickPrefs(raw);
      cur = { ...orig };
    }).catch((e) => (error = e instanceof Error ? e.message : 'Failed to load settings'));
  });

  const dirty = $derived(orig && cur ? Object.keys(diffPrefs(orig, cur)).length > 0 : false);

  async function save() {
    if (!orig || !cur || busy) return;
    busy = true;
    try {
      await api.setPreferences(diffPrefs(orig, cur));
      sync.refresh();
      toast.show('Settings saved');
      onclose();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Save failed';
    } finally { busy = false; }
  }

  const input = 'w-24 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-right text-base dark:border-slate-700';
  const wide = 'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base dark:border-slate-700';
  const h = 'mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase';
  const rowCls = 'flex items-center justify-between gap-3 py-1.5';
</script>

{#snippet kib(label: string, key: 'dl_limit' | 'up_limit' | 'alt_dl_limit' | 'alt_up_limit')}
  <label class={rowCls}>
    <span class="text-[15px]">{label}</span>
    <span class="flex items-center gap-2">
      <input type="number" min="0" inputmode="numeric" class={input} aria-label={label}
        value={bytesToKiB(cur![key])} oninput={(e) => (cur![key] = kibToBytes(+e.currentTarget.value))} />
      <span class="w-12 text-xs text-slate-500">KiB/s</span>
    </span>
  </label>
{/snippet}

{#snippet num(label: string, key: 'max_connec' | 'max_connec_per_torrent' | 'max_uploads' | 'max_uploads_per_torrent' | 'max_active_downloads' | 'max_active_uploads' | 'max_active_torrents')}
  <label class={rowCls}>
    <span class="text-[15px]">{label}</span>
    <input type="number" inputmode="numeric" class={input} aria-label={label}
      value={cur![key]} oninput={(e) => (cur![key] = Math.trunc(+e.currentTarget.value) || -1)} />
  </label>
{/snippet}

<Sheet {open} title="Settings" {onclose}>
  <div class="space-y-6 px-4 pb-4">
    {#if error}<p class="text-sm text-red-500" role="alert">{error}</p>{/if}
    {#if cur}
      <section>
        <h3 class={h}>Speed limits <span class="font-normal normal-case">(0 = unlimited)</span></h3>
        {@render kib('Download limit', 'dl_limit')}
        {@render kib('Upload limit', 'up_limit')}
        {@render kib('Alt download limit', 'alt_dl_limit')}
        {@render kib('Alt upload limit', 'alt_up_limit')}
      </section>

      <section>
        <h3 class={h}>Alt-speed schedule</h3>
        <label class={rowCls}>
          <span class="text-[15px]">Enable schedule</span>
          <input type="checkbox" class="size-5" bind:checked={cur.scheduler_enabled} />
        </label>
        {#if cur.scheduler_enabled}
          <label class={rowCls}>
            <span class="text-[15px]">From</span>
            <input type="time" class={wide + ' !w-auto'} value={toTime(cur.schedule_from_hour, cur.schedule_from_min)}
              onchange={(e) => ([cur!.schedule_from_hour, cur!.schedule_from_min] = fromTime(e.currentTarget.value))} />
          </label>
          <label class={rowCls}>
            <span class="text-[15px]">To</span>
            <input type="time" class={wide + ' !w-auto'} value={toTime(cur.schedule_to_hour, cur.schedule_to_min)}
              onchange={(e) => ([cur!.schedule_to_hour, cur!.schedule_to_min] = fromTime(e.currentTarget.value))} />
          </label>
          <label class={rowCls}>
            <span class="text-[15px]">Days</span>
            <select class={wide + ' !w-auto'} bind:value={cur.scheduler_days}>
              {#each SCHEDULER_DAYS as d, i}<option value={i}>{d}</option>{/each}
            </select>
          </label>
        {/if}
      </section>

      <section>
        <h3 class={h}>Paths</h3>
        <label class="block py-1.5">
          <span class="mb-1 block text-[15px]">Default save path</span>
          <input class={wide} bind:value={cur.save_path} />
        </label>
        <label class={rowCls}>
          <span class="text-[15px]">Use temp path for incomplete</span>
          <input type="checkbox" class="size-5" bind:checked={cur.temp_path_enabled} />
        </label>
        {#if cur.temp_path_enabled}<input class={wide} aria-label="Temp path" bind:value={cur.temp_path} />{/if}
      </section>

      <section>
        <h3 class={h}>Connections <span class="font-normal normal-case">(-1 = unlimited)</span></h3>
        {@render num('Global max connections', 'max_connec')}
        {@render num('Max connections per torrent', 'max_connec_per_torrent')}
        {@render num('Global upload slots', 'max_uploads')}
        {@render num('Upload slots per torrent', 'max_uploads_per_torrent')}
      </section>

      <section>
        <h3 class={h}>Queueing</h3>
        <label class={rowCls}>
          <span class="text-[15px]">Enable queueing</span>
          <input type="checkbox" class="size-5" bind:checked={cur.queueing_enabled} />
        </label>
        {#if cur.queueing_enabled}
          {@render num('Max active downloads', 'max_active_downloads')}
          {@render num('Max active uploads', 'max_active_uploads')}
          {@render num('Max active torrents', 'max_active_torrents')}
        {/if}
      </section>

      <button class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-50"
        disabled={!dirty || busy} onclick={save}>Save</button>
    {:else if !error}
      <p class="py-6 text-center text-slate-500">Loading…</p>
    {/if}
  </div>
</Sheet>
