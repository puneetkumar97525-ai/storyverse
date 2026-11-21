import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Full env (no VITE_ prefix filter) so server-side settings like the proxy
  // target can also come from .env files or the shell.
  const env = loadEnv(mode, process.cwd(), '')

  // Where the dev server forwards /api/* requests. Inside docker compose this
  // is set to http://backend:8000.
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // `@/foo` resolves to `src/foo` (mirrored in tsconfig.app.json).
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // 0.0.0.0 makes the dev server reachable from a container or remote IDE.
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // Dev-server only: accepts proxied hostnames (cloud IDEs, tunnels).
      allowedHosts: true,
      proxy: {
        // The browser calls same-origin `/api/...` and Vite forwards it to
        // FastAPI: no CORS in development, no backend URL in the bundle.
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      restoreMocks: true,
    },
  }
})
