export type Action =
  | { type: 'move'; delta: 1 | -1 }
  | { type: 'open' }
  | { type: 'toggle' }
  | { type: 'selectAll' }
  | { type: 'escape' }
  | { type: 'search' }
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'delete' }
  | { type: 'more' }
  | { type: 'tags' }
  | { type: 'add' }
  | { type: 'settings' }
  | { type: 'help' }
  | { type: 'tab'; index: number };

export interface KeyLike { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }
export interface Ctx { listVisible: boolean; torrentOpen: boolean }

export const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'j / ↓', label: 'Next torrent' },
  { keys: 'k / ↑', label: 'Previous torrent' },
  { keys: 'Enter / o', label: 'Open torrent' },
  { keys: 'x / Space', label: 'Select / deselect' },
  { keys: 'Ctrl+A', label: 'Select all' },
  { keys: 'Esc', label: 'Clear selection, or close torrent' },
  { keys: '/', label: 'Search' },
  { keys: 's', label: 'Start' },
  { keys: 'p', label: 'Stop' },
  { keys: 'Delete', label: 'Delete…' },
  { keys: 'm', label: 'More actions…' },
  { keys: 't', label: 'Category & tags…' },
  { keys: '1–5', label: 'Detail tabs' },
  { keys: 'n', label: 'Add torrent' },
  { keys: ',', label: 'Settings' },
  { keys: '?', label: 'This help' },
];

/** Map a key press to an action; DOM concerns (focus in inputs, open dialogs) are the caller's job. */
export function resolveKey(e: KeyLike, ctx: Ctx): Action | null {
  const mod = e.ctrlKey || e.metaKey;
  if (e.altKey) return null;
  if (mod) return e.key.toLowerCase() === 'a' && ctx.listVisible ? { type: 'selectAll' } : null;

  switch (e.key) {
    case 'j': case 'ArrowDown': return ctx.listVisible ? { type: 'move', delta: 1 } : null;
    case 'k': case 'ArrowUp': return ctx.listVisible ? { type: 'move', delta: -1 } : null;
    case 'Enter': case 'o': return ctx.listVisible ? { type: 'open' } : null;
    case 'x': case ' ': return ctx.listVisible ? { type: 'toggle' } : null;
    case 'Escape': return { type: 'escape' };
    case '/': return ctx.listVisible ? { type: 'search' } : null;
    case 's': return { type: 'start' };
    case 'p': return { type: 'stop' };
    case 'Delete': return { type: 'delete' };
    case 'm': return { type: 'more' };
    case 't': return { type: 'tags' };
    case 'n': return { type: 'add' };
    case ',': return { type: 'settings' };
    case '?': return { type: 'help' };
  }
  if (/^[1-5]$/.test(e.key)) return ctx.torrentOpen ? { type: 'tab', index: Number(e.key) - 1 } : null;
  return null;
}
