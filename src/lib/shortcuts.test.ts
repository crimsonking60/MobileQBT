import { describe, expect, it } from 'vitest';
import { resolveKey, type Ctx } from './shortcuts';

const k = (key: string, mods: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean }> = {}) =>
  ({ key, ctrlKey: false, metaKey: false, altKey: false, ...mods });
const list: Ctx = { listVisible: true, torrentOpen: false };
const detail: Ctx = { listVisible: false, torrentOpen: true };

describe('resolveKey', () => {
  it('moves through the list only when it is visible', () => {
    expect(resolveKey(k('j'), list)).toEqual({ type: 'move', delta: 1 });
    expect(resolveKey(k('ArrowUp'), list)).toEqual({ type: 'move', delta: -1 });
    expect(resolveKey(k('ArrowDown'), detail)).toBeNull(); // let the detail pane scroll
  });
  it('switches tabs only in detail', () => {
    expect(resolveKey(k('3'), detail)).toEqual({ type: 'tab', index: 2 });
    expect(resolveKey(k('3'), list)).toBeNull();
    expect(resolveKey(k('6'), detail)).toBeNull();
  });
  it('ctrl/cmd+A selects all, other modified keys are ignored', () => {
    expect(resolveKey(k('a', { ctrlKey: true }), list)).toEqual({ type: 'selectAll' });
    expect(resolveKey(k('A', { metaKey: true }), list)).toEqual({ type: 'selectAll' });
    expect(resolveKey(k('s', { ctrlKey: true }), list)).toBeNull();
    expect(resolveKey(k('s', { altKey: true }), list)).toBeNull();
  });
  it('maps actions', () => {
    expect(resolveKey(k('Delete'), list)).toEqual({ type: 'delete' });
    expect(resolveKey(k(' '), list)).toEqual({ type: 'toggle' });
    expect(resolveKey(k('?'), detail)).toEqual({ type: 'help' });
    expect(resolveKey(k('z'), list)).toBeNull();
  });
});
