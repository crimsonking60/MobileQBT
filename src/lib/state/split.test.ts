import { describe, expect, it } from 'vitest';
import { clampSplit, DETAIL_MIN, SPLIT_MIN } from './split.svelte';

describe('clampSplit', () => {
  it('keeps the list at least SPLIT_MIN', () => expect(clampSplit(100, 1200)).toBe(SPLIT_MIN));
  it('keeps the detail pane at least DETAIL_MIN', () => expect(clampSplit(2000, 1000)).toBe(1000 - DETAIL_MIN));
  it('passes sane values through', () => expect(clampSplit(450.4, 1200)).toBe(450));
  it('never goes below SPLIT_MIN on narrow viewports', () => expect(clampSplit(500, 768)).toBe(408));
});
