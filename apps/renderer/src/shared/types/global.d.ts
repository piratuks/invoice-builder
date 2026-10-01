import type { ElectronAPI } from '@invoice-builder/contracts';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
