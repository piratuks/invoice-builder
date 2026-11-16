import { describe, beforeAll, it, expect, vi } from 'vitest';
import { DatabaseType, DBInitType, IpcChannel } from '@invoice-builder/contracts';

const bridge = vi.hoisted(() => ({ api: undefined as Record<string, (...args: never[]) => unknown> | undefined }));
const ipcRenderer = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn()
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (_name: string, api: Record<string, (...args: never[]) => unknown>) => {
      bridge.api = api;
    }
  },
  ipcRenderer
}));

describe('preload electronAPI bridge', () => {
  beforeAll(async () => {
    await import('../preload');
  });

  it('exposes and forwards the complete API surface', () => {
    const api = bridge.api;
    expect(api).toBeDefined();
    if (!api) return;
    expect(api.edition).toEqual({});
    expect(api).not.toHaveProperty('ipcRenderer');
    expect(api).not.toHaveProperty('invoke');

    Object.entries(api).forEach(([name, method]) => {
      const invoke = method as unknown as (...args: unknown[]) => unknown;
      if (name.startsWith('onUpdate')) {
        invoke(() => {});
      } else if (name === 'initializeDatabase') {
        invoke({ fullPath: 'C:\\data\\new.db', mode: DBInitType.create, dbType: DatabaseType.sqlite });
      } else if (name !== 'edition') {
        invoke();
      }
    });

    expect(ipcRenderer.invoke).toHaveBeenCalled();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IpcChannel.checkForUpdates);
    expect(ipcRenderer.on).toHaveBeenCalled();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(IpcChannel.initializeDb, {
      fullPath: 'C:\\data\\new.db',
      mode: DBInitType.create,
      dbType: DatabaseType.sqlite
    });
  });

  it('propagates check rejections and removes the updater error listener', async () => {
    const api = bridge.api!;
    const error = new Error('Update check failed');
    ipcRenderer.invoke.mockRejectedValueOnce(error);
    await expect(api.checkForUpdates()).rejects.toThrow(error);

    const callback = vi.fn();
    const subscribe = api.onUpdateError as unknown as (callback: () => void) => () => void;
    const unsubscribe = subscribe(callback);
    const listener = ipcRenderer.on.mock.calls.at(-1)?.[1] as () => void;
    listener();
    expect(callback).toHaveBeenCalledOnce();
    unsubscribe();
    expect(ipcRenderer.removeListener).toHaveBeenCalledWith(IpcChannel.updateError, listener);
  });
});
