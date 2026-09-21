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

    Object.entries(api).forEach(([name, method]) => {
      const invoke = method as unknown as (...args: unknown[]) => unknown;
      if (name.startsWith('onUpdate')) {
        invoke(() => {});
      } else {
        invoke();
      }
    });

    expect(ipcRenderer.invoke).toHaveBeenCalled();
    expect(ipcRenderer.send).toHaveBeenCalledWith('check-for-updates');
    expect(ipcRenderer.on).toHaveBeenCalled();
  });
});
