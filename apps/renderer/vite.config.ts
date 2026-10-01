import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const rendererRoot = import.meta.dirname;
  const repositoryRoot = path.resolve(rendererRoot, '..', '..');
  const environment = loadEnv(mode, rendererRoot);
  const apiOrigin = environment.VITE_API_URL ?? '';

  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%API_ORIGIN%/g, apiOrigin);
        }
      }
    ],
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true
        }
      }
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true
    },
    build: {
      outDir: path.resolve(repositoryRoot, 'dist-fe'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500
    },
    resolve: {
      tsconfigPaths: true,
      alias: {
        '@': path.join(rendererRoot, 'src'),
        // Absolute aliases for monaco worker entry files: Rolldown's worker
        // bundler fails to resolve bare `monaco-editor/...` specifiers.
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
  };
});
