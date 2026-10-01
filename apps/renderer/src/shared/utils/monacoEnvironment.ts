// Configures Monaco's web workers using Vite's `?worker` imports so the bundler can
// statically resolve them, avoiding monaco-editor's default ESM `new URL(...)` worker
// bootstrap which Vite/Electron cannot resolve at runtime.
import EditorWorker from './workers/editor.worker?worker';
import JsonWorker from './workers/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') {
      return new JsonWorker();
    }
    return new EditorWorker();
  }
};
