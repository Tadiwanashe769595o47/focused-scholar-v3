import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    define: {
      'import.meta.env.VITE_API_URL': env.VITE_API_URL ? JSON.stringify(env.VITE_API_URL) : JSON.stringify('/api')
    },
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
