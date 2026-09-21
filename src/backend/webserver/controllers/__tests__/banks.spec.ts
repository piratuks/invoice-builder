import { initBanksController } from '../banks';

const routes = vi.hoisted(() => ({
  handlers: new Map<string, (req: unknown, res: unknown) => Promise<void>>()
}));
const services = vi.hoisted(() => ({
  getAllBanks: vi.fn().mockResolvedValue({ success: true, data: [] }),
  addBank: vi.fn().mockResolvedValue({ success: true }),
  updateBank: vi.fn().mockResolvedValue({ success: true }),
  deleteBank: vi.fn().mockResolvedValue({ success: true }),
  batchAddBank: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../../../shared/services/banks', () => services);
vi.mock('../../../shared/utils/dataUrlFunctions', () => ({
  decodeBank: (value: unknown) => value,
  encodeResultBank: (value: unknown) => ({ encoded: value })
}));
vi.mock('../../database', () => ({ dbInstance: { type: 'sqlite' } }));
vi.mock('../../utils/functions', () => ({
  parseFilter: (value: string) => ({ parsed: value }),
  requireDB: (_req: unknown, _res: unknown, next: () => void) => next()
}));

const app = {
  get: (_path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`GET:${_path}`, handler);
  },
  post: (_path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`POST:${_path}`, handler);
  },
  put: (_path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`PUT:${_path}`, handler);
  },
  delete: (_path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`DELETE:${_path}`, handler);
  }
};

const invoke = async (method: string, path: string, request: Record<string, unknown>) => {
  const json = vi.fn();
  await routes.handlers.get(`${method}:${path}`)?.(request, { json });
  return json;
};

describe('webserver bank controller', () => {
  beforeEach(() => {
    routes.handlers.clear();
    Object.values(services).forEach(mock => mock.mockClear());
    initBanksController(app as never);
  });

  it('registers and serves all bank endpoints', async () => {
    await invoke('GET', '/api/banks', { query: { filter: 'active' } });
    await invoke('POST', '/api/banks', { body: { id: 1, name: 'Main' } });
    await invoke('PUT', '/api/banks', { body: { id: 1, name: 'Updated' } });
    await invoke('DELETE', '/api/banks/:id', { params: { id: '1' } });
    await invoke('POST', '/api/banks/batch', { body: [{ id: 1, name: 'Main' }] });

    expect(services.getAllBanks).toHaveBeenCalledWith(expect.anything(), { parsed: 'active' });
    expect(services.addBank).toHaveBeenCalledWith(expect.anything(), { id: 1, name: 'Main' });
    expect(services.updateBank).toHaveBeenCalledWith(expect.anything(), { id: 1, name: 'Updated' });
    expect(services.deleteBank).toHaveBeenCalledWith(expect.anything(), 1);
    expect(services.batchAddBank).toHaveBeenCalledWith(expect.anything(), [{ id: 1, name: 'Main' }]);
  });
});
