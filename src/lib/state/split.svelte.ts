const KEY = 'mobileqbt.splitWidth';
export const SPLIT_MIN = 320;
export const SPLIT_DEFAULT = 416; // 26rem
/** the detail pane never gets narrower than this */
export const DETAIL_MIN = 360;

export function clampSplit(w: number, viewport: number): number {
  const max = Math.max(SPLIT_MIN, viewport - DETAIL_MIN);
  return Math.round(Math.min(max, Math.max(SPLIT_MIN, w)));
}

function load(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? n : SPLIT_DEFAULT;
  } catch { return SPLIT_DEFAULT; }
}

class Split {
  /** requested width; clamp against the live viewport when rendering */
  width = $state(typeof localStorage === 'undefined' ? SPLIT_DEFAULT : load());

  set(w: number) { this.width = w; }
  save() { try { localStorage.setItem(KEY, String(this.width)); } catch { /* storage unavailable */ } }
  reset() { this.width = SPLIT_DEFAULT; this.save(); }
}

export const split = new Split();
