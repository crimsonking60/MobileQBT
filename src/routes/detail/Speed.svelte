<script lang="ts">
  import { formatSpeed, niceSpeedMax } from '../../lib/format';
  import type { SpeedHistory } from '../../lib/state/history.svelte';

  let { history }: { history: SpeedHistory } = $props();

  // sky-600 / emerald-600: validated for CVD separation and contrast in light and dark.
  // Upload is also dashed so identity never rests on hue alone.
  const DOWN = '#0284c7', UP = '#059669';
  const H = 180, PAD = { l: 8, r: 8, t: 12, b: 20 };

  let W = $state(340);
  let hover = $state<number | null>(null);

  const s = $derived(history.samples);
  const last = $derived(s.at(-1));

  const max = $derived(niceSpeedMax(Math.max(0, ...s.flatMap((x) => [x.down, x.up]))));
  const peakDown = $derived(Math.max(0, ...s.map((x) => x.down)));
  const peakUp = $derived(Math.max(0, ...s.map((x) => x.up)));

  const x = (i: number) => PAD.l + (s.length < 2 ? 0 : (i / (s.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const line = (k: 'down' | 'up') => s.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join('');
  const area = $derived(s.length < 2 ? '' : `${line('down')}L${x(s.length - 1)},${y(0)}L${x(0)},${y(0)}Z`);
  const grid = $derived([0, 0.5, 1].map((f) => ({ y: y(max * f), label: formatSpeed(max * f) })));

  const spanSec = $derived(s.length > 1 ? Math.round((s.at(-1)!.t - s[0].t) / 1000) : 0);
  const ago = (t: number) => Math.max(0, Math.round(((last?.t ?? t) - t) / 1000));

  function onmove(e: PointerEvent) {
    if (s.length < 2) return;
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const f = (e.clientX - r.left - PAD.l) / (r.width - PAD.l - PAD.r);
    hover = Math.min(s.length - 1, Math.max(0, Math.round(f * (s.length - 1))));
  }

  // end-of-line labels; nudge apart when the two lines finish close together
  const labelY = $derived.by(() => {
    if (!last) return { down: 0, up: 0 };
    let d = y(last.down) - 6, u = y(last.up) - 6;
    if (Math.abs(d - u) < 14) { if (last.down >= last.up) u += 14; else d += 14; }
    return { down: d, up: u };
  });

  const tile = 'rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800';
</script>

<div class="space-y-4 p-4">
  <div class="grid grid-cols-2 gap-2 text-sm tabular-nums">
    <div class={tile}><div class="text-xs text-slate-500">Download</div><div class="text-lg font-semibold">{formatSpeed(last?.down ?? 0)}</div>
      <div class="text-xs text-slate-500">peak {formatSpeed(peakDown)}</div></div>
    <div class={tile}><div class="text-xs text-slate-500">Upload</div><div class="text-lg font-semibold">{formatSpeed(last?.up ?? 0)}</div>
      <div class="text-xs text-slate-500">peak {formatSpeed(peakUp)}</div></div>
  </div>

  <div class="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
    <span class="flex items-center gap-1.5"><svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke={DOWN} stroke-width="2" /></svg>Download</span>
    <span class="flex items-center gap-1.5"><svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke={UP} stroke-width="2" stroke-dasharray="4 3" /></svg>Upload</span>
  </div>

  <div bind:clientWidth={W}>
    {#if s.length < 2}
      <p class="grid h-[180px] place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">
        Collecting samples while this page is open…
      </p>
    {:else}
      <svg viewBox="0 0 {W} {H}" width={W} height={H} role="img" class="touch-pan-y select-none"
           aria-label="Speed over the last {spanSec} seconds"
           onpointermove={onmove} onpointerdown={onmove} onpointerleave={() => (hover = null)}>
        {#each grid as g}
          <line x1={PAD.l} x2={W - PAD.r} y1={g.y} y2={g.y} class="stroke-slate-200 dark:stroke-slate-700" stroke-width="1" />
          <text x={PAD.l} y={g.y - 3} class="fill-slate-500 text-[10px]">{g.label}</text>
        {/each}
        <path d={area} fill={DOWN} fill-opacity="0.12" />
        <path d={line('down')} fill="none" stroke={DOWN} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <path d={line('up')} fill="none" stroke={UP} stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round" stroke-linecap="round" />
        {#if last}
          <text x={W - PAD.r - 2} y={labelY.down} text-anchor="end" class="text-[10px] font-medium" fill={DOWN}>Down</text>
          <text x={W - PAD.r - 2} y={labelY.up} text-anchor="end" class="text-[10px] font-medium" fill={UP}>Up</text>
        {/if}
        <text x={PAD.l} y={H - 5} class="fill-slate-500 text-[10px]">−{spanSec}s</text>
        <text x={W - PAD.r} y={H - 5} text-anchor="end" class="fill-slate-500 text-[10px]">now</text>
        {#if hover !== null}
          {@const p = s[hover]}
          <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} class="stroke-slate-400" stroke-width="1" />
          <circle cx={x(hover)} cy={y(p.down)} r="4" fill={DOWN} class="stroke-white dark:stroke-slate-900" stroke-width="2" />
          <circle cx={x(hover)} cy={y(p.up)} r="4" fill={UP} class="stroke-white dark:stroke-slate-900" stroke-width="2" />
        {/if}
      </svg>
      <div class="mt-1 h-5 text-xs text-slate-600 tabular-nums dark:text-slate-300" aria-live="off">
        {#if hover !== null}
          {@const p = s[hover]}
          {ago(p.t) === 0 ? 'now' : `${ago(p.t)}s ago`} · ↓ {formatSpeed(p.down)} · ↑ {formatSpeed(p.up)}
        {/if}
      </div>
    {/if}
  </div>

  <details class="text-sm">
    <summary class="cursor-pointer text-slate-500">Data table</summary>
    <table class="mt-2 w-full text-left text-xs tabular-nums">
      <thead class="text-slate-500"><tr><th class="py-1 font-medium">When</th><th class="font-medium">Download</th><th class="font-medium">Upload</th></tr></thead>
      <tbody>
        {#each s.slice(-20).reverse() as p}
          <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-1">{ago(p.t) === 0 ? 'now' : `${ago(p.t)}s ago`}</td><td>{formatSpeed(p.down)}</td><td>{formatSpeed(p.up)}</td></tr>
        {/each}
      </tbody>
    </table>
  </details>
</div>
