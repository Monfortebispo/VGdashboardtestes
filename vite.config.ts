import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist-modern',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: 'src/modern/main.ts',
      output: {
        entryFileNames: 'assets/modern-main.js',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
});
