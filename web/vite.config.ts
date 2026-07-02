import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages':      path.resolve(__dirname, 'src/pages'),
      '@theme':      path.resolve(__dirname, 'src/theme'),
      '@hooks':      path.resolve(__dirname, 'src/hooks'),
      '@services':   path.resolve(__dirname, 'src/services'),
      '@types':      path.resolve(__dirname, 'src/types'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
