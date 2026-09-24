import { builtinModules } from 'module';
import path from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@electron-webauthn/native', 'electron-webauthn']
  },
  build: {
    outDir: 'dist-be/backend/main',
    target: 'node20',
    lib: {
      entry: 'src/backend/main/main.ts',
      formats: ['cjs'],
      fileName: () => 'main.cjs'
    },
    rollupOptions: {
      external: [
        '@electron-webauthn/native',
        'electron-webauthn',
        'electron',
        'keytar',
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
    alias: {
      '@main': path.resolve(__dirname, 'src/backend/main')
    }
  },
  publicDir: false,
  plugins: [
    tsconfigPaths({ projects: ['tsconfig.node.json'] }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/backend/main/assets/**/*',
          dest: 'assets'
        }
      ]
    })
  ]
});
