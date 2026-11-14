<script lang="ts">
  import { clampSplit, split } from '../state/split.svelte';

  let dragging = $state(false);
  const STEP = 24;

  function move(e: PointerEvent) {
    if (dragging) split.set(clampSplit(e.clientX, innerWidth));
  }
  function end(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    split.save();
  }
  function key(e: KeyboardEvent) {
    const d = e.key === 'ArrowLeft' ? -STEP : e.key === 'ArrowRight' ? STEP : 0;
    if (!d) return;
    e.preventDefault();
    split.set(clampSplit(split.width + d, innerWidth));
    split.save();
  }
</script>

<!-- a focusable separator is the ARIA window-splitter pattern -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<!-- wide hit area around a 1px line; touch-action none so a finger drag isn't taken by scrolling -->
<div role="separator" aria-orientation="vertical" aria-label="Resize list" tabindex="0"
  aria-valuenow={split.width} aria-valuemin={320}
  class="group relative z-10 -mx-2 w-4 shrink-0 cursor-col-resize touch-none outline-none"
  onpointerdown={(e) => { dragging = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
  onpointermove={move} onpointerup={end} onpointercancel={end} onkeydown={key} ondblclick={() => split.reset()}>
  <div class="mx-auto h-full w-px bg-slate-200 transition-colors group-hover:bg-sky-500 group-focus-visible:bg-sky-500
              dark:bg-slate-800 {dragging ? '!bg-sky-500' : ''}"></div>
  <div class="absolute top-1/2 left-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
</div>
