<script lang="ts">
  import { api } from '../lib/api/client';
  import { sync } from '../lib/state/sync.svelte';

  let username = $state('admin');
  let password = $state('');
  let busy = $state(false);
  let error = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    busy = true; error = '';
    try {
      if (await api.login(username, password)) { sync.reset(); sync.refresh(); }
      else error = 'Wrong username or password';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not reach qBittorrent';
    } finally { busy = false; }
  }
</script>

<div class="grid min-h-dvh place-items-center p-6">
  <form onsubmit={submit} class="w-full max-w-sm space-y-4">
    <h1 class="text-2xl font-semibold">mobileqbt</h1>
    <label class="block text-sm">Username
      <input bind:value={username} autocomplete="username" autocapitalize="none" required
        class="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-base dark:border-slate-700" />
    </label>
    <label class="block text-sm">Password
      <input bind:value={password} type="password" autocomplete="current-password" required
        class="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-base dark:border-slate-700" />
    </label>
    {#if error}<p class="text-sm text-red-500" role="alert">{error}</p>{/if}
    <button disabled={busy} class="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white disabled:opacity-60">
      {busy ? 'Signing in…' : 'Sign in'}
    </button>
  </form>
</div>
