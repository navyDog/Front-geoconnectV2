import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
/// <reference types="vitest" />

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Toutes les requêtes /api/* sont transmises au backend Spring Boot.
        // Le préfixe /api est conservé car le backend a un context-path: /api.
        //
        // Le hook proxyReq convertit le cookie temporaire pdf_token en header
        // Authorization: Bearer, ce qui permet à window.open() d'accéder aux
        // endpoints sécurisés sans exposer le JWT dans l'URL.
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Uniquement si la requête n'a pas déjà un header Authorization
              // (les appels axios le posent eux-mêmes, window.open ne le fait pas)
              if (!proxyReq.getHeader('Authorization')) {
                const cookies = (req.headers.cookie as string) ?? '';
                const match = cookies.match(/pdf_token=([^;]+)/);
                if (match) {
                  proxyReq.setHeader('Authorization', `Bearer ${match[1]}`);
                }
              }
            });
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
  };
});
