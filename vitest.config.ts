import react from '@vitejs/plugin-react';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

const repositoryRoot = import.meta.dirname;
const rendererRoot = path.resolve(repositoryRoot, 'apps', 'renderer');

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: path.join(rendererRoot, 'setupTests.ts'),
    coverage: {
      include: ['apps/renderer/src/**', 'apps/desktop/**', 'packages/core/src/**', 'apps/server/**'],
      exclude: [
        'apps/renderer/src/main.tsx',
        'apps/renderer/src/mocks/**',
        'apps/desktop/main/assets/**',
        'apps/renderer/src/assets/**'
      ],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80
      }
    },
    exclude: [...configDefaults.exclude, 'node_modules'],
    include: [
      'apps/renderer/src/**/__tests__/*.{test,spec}.{js,ts,jsx,tsx}',
      'apps/desktop/**/__tests__/*.{test,spec}.{js,ts,jsx,tsx}',
      'packages/core/src/**/__tests__/*.{test,spec}.{js,ts,jsx,tsx}',
      'apps/server/**/__tests__/*.{test,spec}.{js,ts,jsx,tsx}'
    ]
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.join(rendererRoot, 'src'),
      '@monaco-editor-worker/editor': path.resolve(
        repositoryRoot,
        'node_modules/monaco-editor/esm/vs/editor/editor.worker.js'
      ),
      '@monaco-editor-worker/json': path.resolve(
        repositoryRoot,
        'node_modules/monaco-editor/esm/vs/language/json/json.worker.js'
      )
    }
  }
});
