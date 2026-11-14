<script lang="ts">
  import type { Tone } from '../format';
  let { value, tone }: { value: number; tone: Tone } = $props();
  const color: Record<Tone, string> = {
    down: 'bg-sky-500', up: 'bg-emerald-500', idle: 'bg-slate-400',
    error: 'bg-red-500', busy: 'bg-amber-500',
  };
</script>

<div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
     role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin="0" aria-valuemax="100">
  <div class="h-full rounded-full transition-[width] duration-500 {color[tone]}" style:width="{value * 100}%"></div>
</div>
