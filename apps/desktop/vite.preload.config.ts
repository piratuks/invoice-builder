import path from 'path';
import { defineConfig } from 'vite';

const desktopRoot = import.meta.dirname;
const repositoryRoot = path.resolve(desktopRoot, '..', '..');

export default defineConfig({
  build: {
    outDir: path.resolve(repositoryRoot, 'dist-desktop', 'preload'),
    emptyOutDir: true,
    target: 'node20',
    lib: {
      entry: path.resolve(desktopRoot, 'preload', 'preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.cjs'
    },
    rollupOptions: {
      external: ['electron', 'fs', 'path', 'url', 'os'],
      output: {
        entryFileNames: 'preload.cjs',
        format: 'cjs'
      }
    }
  },
  resolve: {
    tsconfigPaths: true
  },
  publicDir: false,
  plugins: []
});
