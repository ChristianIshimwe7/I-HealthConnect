import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://i-healthconnect.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL || 'https://i-healthconnect.onrender.com/api'),
      VITE_SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://nmzmkkwhtgkspfvbdxgr.supabase.co'),
      VITE_SUPABASE_ANON_KEY: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7')
    }
  }
});
