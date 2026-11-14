import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.QBT_URL || 'http://127.0.0.1:28080';
  return {
    // relative assets so the build works as an alt-WebUI folder or under any proxy path
    base: './',
    plugins: [svelte(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: false,
          // qBittorrent validates Host/Origin against its own port; present as the target
          headers: { Host: new URL(target).host },
        },
      },
    },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  };
});
