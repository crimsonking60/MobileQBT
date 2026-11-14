<script lang="ts">
  import type { Torrent } from '../api/types';
  import { formatBytes, formatEta, formatPercent, formatSpeed, stateInfo } from '../format';
  import ProgressBar from './ProgressBar.svelte';

  let { t, selected, selecting, active = false, cursor = false, ontap, onselect }: {
    t: Torrent; selected: boolean; selecting: boolean; active?: boolean; cursor?: boolean;
    ontap: () => void; onselect: () => void;
  } = $props();

  const info = $derived(stateInfo(t.state));
  const done = $derived(t.progress >= 1);

  // long-press enters selection mode
  let timer: ReturnType<typeof setTimeout> | undefined;
  let longPressed = false;
  let origin = { x: 0, y: 0 };

  function down(e: PointerEvent) {
    longPressed = false;
    origin = { x: e.clientX, y: e.clientY };
    timer = setTimeout(() => { longPressed = true; navigator.vibrate?.(10); onselect(); }, 450);
  }
  function move(e: PointerEvent) {
    if (Math.abs(e.clientX - origin.x) > 8 || Math.abs(e.clientY - origin.y) > 8) clearTimeout(timer);
  }
  const cancel = () => clearTimeout(timer);
  function click() {
    if (longPressed) { longPressed = false; return; }
    selecting ? onselect() : ontap();
  }
</script>

<button type="button"
  class="flex h-full w-full flex-col justify-center gap-1.5 border-b border-slate-200 px-4 text-left select-none
         active:bg-slate-100 dark:border-slate-800 dark:active:bg-slate-800/60
         {selected ? 'bg-sky-50 dark:bg-sky-950/40' : active ? 'bg-slate-100 dark:bg-slate-800/60' : ''}
         {cursor ? 'ring-2 ring-sky-500/70 ring-inset' : ''}"
  onpointerdown={down} onpointermove={move} onpointerup={cancel} onpointercancel={cancel} onpointerleave={cancel}
  oncontextmenu={(e) => e.preventDefault()} onclick={click} aria-pressed={selecting ? selected : undefined}>
  <div class="flex items-center gap-2">
    {#if selecting}
      <span class="grid size-5 shrink-0 place-items-center rounded-full border-2
                   {selected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-400'}">
        {#if selected}<svg viewBox="0 0 20 20" class="size-3.5" fill="currentColor"><path d="M7.7 13.6 4.4 10.3l-1.1 1.1 4.4 4.4 9-9-1.1-1.1z"/></svg>{/if}
      </span>
    {/if}
    <span class="truncate text-[15px] font-medium">{t.name}</span>
  </div>
  <ProgressBar value={t.progress} tone={info.tone} />
  <div class="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
    <span class="truncate">{info.label} · {formatPercent(t.progress)} · {formatBytes(t.size)}</span>
    <span class="shrink-0 tabular-nums">
      {#if t.dlspeed > 0}↓ {formatSpeed(t.dlspeed)}{/if}
      {#if t.upspeed > 0}{t.dlspeed > 0 ? ' ' : ''}↑ {formatSpeed(t.upspeed)}{/if}
      {#if !done && t.dlspeed > 0} · {formatEta(t.eta)}{/if}
      {#if t.dlspeed === 0 && t.upspeed === 0 && done}ratio {t.ratio.toFixed(2)}{/if}
    </span>
  </div>
</button>
