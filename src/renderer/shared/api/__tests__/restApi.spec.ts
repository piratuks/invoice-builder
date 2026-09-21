import { getApi, isWebMode } from '../restApi';

describe('isWebMode/getApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    // @ts-expect-error - cleaning up test-only global
    delete window.electronAPI;
  });

  it('reports web mode when electronAPI is not present', () => {
    expect(isWebMode()).toBe(true);
  });

  // `isElectron` is computed once at module load time, so the electron-mode
  // branch requires defining window.electronAPI before the module is (re-)imported.
  it('reports electron mode when electronAPI is present', async () => {
    Object.defineProperty(window, 'electronAPI', { value: { ping: vi.fn() }, configurable: true });
    vi.resetModules();
    const restApi = await import('../restApi');
    expect(restApi.isWebMode()).toBe(false);
  });

  it('returns the electronAPI instance when in electron mode', async () => {
    const mockApi = { ping: vi.fn() };
    Object.defineProperty(window, 'electronAPI', { value: mockApi, configurable: true });
    vi.resetModules();
    const restApi = await import('../restApi');
    expect(restApi.getApi()).toBe(mockApi);
  });

  it('returns a web API instance when electronAPI is not present', () => {
    const api = getApi();
    expect(typeof api.ping).toBe('function');
  });
});
