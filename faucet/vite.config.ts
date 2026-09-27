import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const buildCommit = env.CF_PAGES_COMMIT_SHA || env.GITHUB_SHA || env.VITE_CF_PAGES_COMMIT_SHA || 'main';

  return {
    define: {
      'import.meta.env.VITE_CF_PAGES_COMMIT_SHA': JSON.stringify(buildCommit)
    },
    plugins: [react()],
    build: {
      target: 'es2022',
      sourcemap: true,
      cssMinify: 'lightningcss'
    },
    server: {
      port: 5173
    }
  };
});
