<script lang="ts">
  /** Stroke icons on a 24px grid (Lucide-style); colour comes from currentColor. */
  const PATHS = {
    play: 'M6 4l14 8-14 8z',
    pause: 'M7 4v16M17 4v16',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    'more-v': 'M12 5h.01M12 12h.01M12 19h.01',
    close: 'M6 6l12 12M18 6L6 18',
    plus: 'M12 5v14M5 12h14',
    back: 'M15 5l-7 7 7 7',
    check: 'M5 12l5 5 9-10',
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-right': 'M9 6l6 6-6 6',
    filter: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M7 10v4M17 16v4',
    gauge: 'M12 14l4-4M3.5 17a9 9 0 1 1 17 0',
  } as const;

  let { name, size = 20, filled = false }: { name: keyof typeof PATHS; size?: number; filled?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
     stroke-width={name.startsWith('more') ? 3.5 : 2} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0">
  <path d={PATHS[name]} />
</svg>
