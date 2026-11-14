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
          // qBittorrent's CSRF check compares Host, Origin and Referer with each other and with
          // its own port, so present all three as the target (dev only; production is same-origin)
          headers: { Host: new URL(target).host },
          configure: (proxy) => {
            proxy.on('proxyReq', (req) => {
              if (req.getHeader('origin')) req.setHeader('origin', target);
              if (req.getHeader('referer')) req.setHeader('referer', `${target}/`);
            });
          },
        },
      },
    },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  };
});
