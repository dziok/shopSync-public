import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const devProxyTarget =
    env.VITE_DEV_PROXY_TARGET ??
    env.VITE_API_URL ??
    'http://localhost:3000';

  return {

  define: {
    global: {},
  },
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Nasłuchuj na wszystkich interfejsach sieciowych
    port: 5173,
    proxy: {
      '/api': {
        target: devProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  };
});
