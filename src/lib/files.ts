import type { FilePriority, TorrentFile } from './api/types';

export interface FileNode {
  /** path segment */
  name: string;
  /** full path; folders end without a slash */
  path: string;
  isDir: boolean;
  size: number;
  /** bytes downloaded (only counts files that are wanted) */
  done: number;
  /** size of the files that are wanted (priority > 0) */
  wanted: number;
  /** file priority; for folders the common priority of all descendants, or 'mixed' */
  priority: FilePriority | 'mixed';
  /** indexes of every file at or below this node */
  indexes: number[];
  children: FileNode[];
}

export function buildTree(files: TorrentFile[]): FileNode[] {
  const root: FileNode = mk('', '', true);
  for (const f of files) {
    const parts = f.name.split('/');
    let cur = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/');
      const last = i === parts.length - 1;
      let child = cur.children.find((c) => c.name === part && c.isDir === !last);
      if (!child) {
        child = mk(part, path, !last);
        cur.children.push(child);
      }
      if (last) {
        child.size = f.size;
        child.priority = f.priority;
        child.indexes = [f.index];
        child.wanted = f.priority > 0 ? f.size : 0;
        child.done = f.priority > 0 ? f.size * f.progress : 0;
      }
      cur = child;
    });
  }
  roll(root);
  sort(root);
  return root.children;
}

function mk(name: string, path: string, isDir: boolean): FileNode {
  return { name, path, isDir, size: 0, done: 0, wanted: 0, priority: 1, indexes: [], children: [] };
}

function roll(n: FileNode) {
  if (!n.isDir) return;
  let first = true;
  for (const c of n.children) {
    roll(c);
    n.size += c.size;
    n.done += c.done;
    n.wanted += c.wanted;
    n.indexes.push(...c.indexes);
    if (first) { n.priority = c.priority; first = false; }
    else if (n.priority !== c.priority) n.priority = 'mixed';
  }
}

function sort(n: FileNode) {
  n.children.sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name, undefined, { numeric: true }));
  n.children.forEach(sort);
}

/** Progress of the wanted bytes, 0..1 (1 when nothing is wanted). */
export const nodeProgress = (n: FileNode) => (n.wanted > 0 ? n.done / n.wanted : 1);

export const PRIORITIES: { value: FilePriority; label: string }[] = [
  { value: 0, label: 'Skip' },
  { value: 1, label: 'Normal' },
  { value: 6, label: 'High' },
  { value: 7, label: 'Maximum' },
];

export const priorityLabel = (p: FileNode['priority']) =>
  p === 'mixed' ? 'Mixed' : (PRIORITIES.find((x) => x.value === p)?.label ?? String(p));

/** Flatten the visible rows given which folders are expanded. */
export function visibleRows(nodes: FileNode[], expanded: Set<string>, depth = 0): { node: FileNode; depth: number }[] {
  return nodes.flatMap((n) => [
    { node: n, depth },
    ...(n.isDir && expanded.has(n.path) ? visibleRows(n.children, expanded, depth + 1) : []),
  ]);
}
