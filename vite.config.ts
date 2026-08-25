import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist-modern',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/modern/main.ts'),
      output: {
        entryFileNames: 'assets/modern-main.js',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
});
