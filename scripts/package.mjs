// Builds the app and lays it out as a qBittorrent alternative WebUI:
//   release/mobileqbt-webui/public/...   (folder: point "Use alternative WebUI" at it)
//   release/mobileqbt-webui.zip          (same content, for copying around)
// Also leaves the plain build in dist/ for reverse-proxy deployments.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });

run('npx', ['vite', 'build']);

// replace only the contents: the dev container bind-mounts release/mobileqbt-webui,
// and deleting that directory itself would leave the mount pointing at nothing
mkdirSync('release/mobileqbt-webui', { recursive: true });
for (const f of ['release/mobileqbt-webui/public', 'release/mobileqbt-webui.zip']) rmSync(f, { recursive: true, force: true });
cpSync('dist', 'release/mobileqbt-webui/public', { recursive: true });

const cwd = 'release/mobileqbt-webui';
const zippers = [
  ['zip', ['-qr', '../mobileqbt-webui.zip', 'public']],
  ['python3', ['-m', 'zipfile', '-c', '../mobileqbt-webui.zip', 'public']],
];
if (!zippers.some(([cmd, args]) => { try { run(cmd, args, { cwd }); return true; } catch { return false; } })) {
  console.warn('neither zip nor python3 found; skipping the .zip (the folder is still usable)');
}
console.log(existsSync('release/mobileqbt-webui.zip') ? 'release/mobileqbt-webui.zip ready' : 'release/ ready');
