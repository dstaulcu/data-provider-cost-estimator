import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  publicDir: '../public',
  // Copy config files to dist during build
  assetsInclude: ['**/*.yaml', '**/*.yml']
});