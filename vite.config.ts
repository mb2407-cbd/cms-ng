/**
 * @file vite.config.ts
 * @description Vite configuration for VLS UI Modern
 * @author VLS Team
 * @date 2026-02-15
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    // Proxy to bypass CORS during development
    proxy: {
      '/api': {
        target: 'https://86xcffn8cf.execute-api.us-west-2.amazonaws.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // Keep /api prefix
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // Override Origin header to match production domain
            proxyReq.setHeader('Origin', 'https://ssla.vls.directvla.com');
            proxyReq.setHeader('Referer', 'https://ssla.vls.directvla.com/');
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
