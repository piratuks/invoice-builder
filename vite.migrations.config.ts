import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';
import { defineConfig } from 'vite';

const MIGRATIONS_SRC = path.resolve(import.meta.dirname, 'src', 'backend', 'shared', 'migrations');

export default defineConfig(() => {
  const files = fs.readdirSync(MIGRATIONS_SRC).filter(f => f.endsWith('.ts'));
  const input: Record<string, string> = {};
  for (const file of files) {
    const name = file.replace(/\.ts$/i, '');
    input[name] = path.join(MIGRATIONS_SRC, file);
  }

  return {
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist-be', 'backend', 'migrations'),
      target: 'node20',
      lib: {
        entry: input,
        formats: ['cjs'],
        fileName: name => `${name}.cjs`
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
          entryFileNames: '[name].cjs',
          format: 'cjs'
        }
      }
    },
    resolve: {
      tsconfigPaths: true,
      alias: {
        '@main': path.resolve(import.meta.dirname, 'src/backend/main')
      }
    },
    publicDir: false,
    plugins: []
  };
});
