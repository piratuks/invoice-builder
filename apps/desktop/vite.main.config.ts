import { builtinModules } from 'module';
import path from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const desktopRoot = import.meta.dirname;
const repositoryRoot = path.resolve(desktopRoot, '..', '..');

export default defineConfig({
  optimizeDeps: {
    exclude: ['@electron-webauthn/native', 'electron-webauthn']
  },
  build: {
    outDir: path.resolve(repositoryRoot, 'dist-desktop', 'main'),
    emptyOutDir: true,
    target: 'node20',
    lib: {
      entry: path.resolve(desktopRoot, 'main', 'main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.cjs'
    },
    rollupOptions: {
      external: [
        '@electron-webauthn/native',
        'electron-webauthn',
        'electron',
        'sqlite3',
        'fs',
        'path',
        'url',
        'os',
        'crypto',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ],
      output: {
        entryFileNames: 'main.cjs'
      }
    }
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@main': path.resolve(desktopRoot, 'main')
    }
  },
  publicDir: false,
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'main/assets/**/*',
          dest: 'assets'
        }
      ]
    })
  ]
});
