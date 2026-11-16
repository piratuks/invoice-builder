import type { ElectronAPI } from '@invoice-builder/contracts';
import type { EditionBridgeApi } from '../../edition/contract';

declare global {
  interface Window {
    electronAPI: ElectronAPI & { edition: EditionBridgeApi };
  }
}

export {};
