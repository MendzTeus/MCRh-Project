/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.API_PORT || 3001}`,
          changeOrigin: true,
        },
      },
    },
    test: {
      // Placeholder credentials so server modules can be imported in tests
      // without a real database. The URL is a closed local port, so any DB call
      // a test reaches fails instantly and offline — never production.
      env: {
        SUPABASE_URL: 'http://127.0.0.1:9',
        SUPABASE_SERVICE_KEY: 'test-key',
      },
    },
  };
});
