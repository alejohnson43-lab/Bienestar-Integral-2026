import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.svg'],
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Bienestar Integral',
          short_name: 'BI',
          description: 'Aplicación de Bienestar Integral',
          theme_color: '#13ecb6', // Matches primary brand color
          background_color: '#13ecb6',
          display: 'standalone',
          orientation: 'portrait',
          id: '/', // Consistent PWA ID
          start_url: '/',
          icons: [
            {
              src: 'logo.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable' // Important for adaptive icons
            },
            {
              src: 'logo.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || "")
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./', import.meta.url)),
      }
    }
  };
});
