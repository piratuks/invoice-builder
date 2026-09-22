import { initBusinessesController } from '../businesses';
import { initCategoriesController } from '../categories';
import { initSettingsController } from '../settings';

const routes = vi.hoisted(() => ({
  handlers: new Map<string, (req: unknown, res: unknown) => Promise<void>>()
}));
const services = vi.hoisted(() => ({
  getAllBusinesses: vi.fn().mockResolvedValue({ success: true, data: [] }),
  addBusiness: vi.fn().mockResolvedValue({ success: true }),
  updateBusiness: vi.fn().mockResolvedValue({ success: true }),
  deleteBusiness: vi.fn().mockResolvedValue({ success: true }),
  batchAddBusiness: vi.fn().mockResolvedValue({ success: true }),
  getAllCategories: vi.fn().mockResolvedValue({ success: true, data: [] }),
  addCategory: vi.fn().mockResolvedValue({ success: true }),
  updateCategory: vi.fn().mockResolvedValue({ success: true }),
  deleteCategory: vi.fn().mockResolvedValue({ success: true }),
  batchAddCategory: vi.fn().mockResolvedValue({ success: true }),
  getAllSettings: vi.fn().mockResolvedValue({ success: true, data: null }),
  updateSettings: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../../../shared/services/businesses', () => services);
vi.mock('../../../shared/services/categories', () => services);
vi.mock('../../../shared/services/settings', () => services);
vi.mock('../../../shared/utils/dataUrlFunctions', () => ({
  decodeLogo: (value: unknown) => value,
  encodeResultBusiness: (value: unknown) => ({ encoded: value })
}));
vi.mock('../../utils/functions', () => ({
  parseFilter: (value: string) => ({ parsed: value }),
  requireDB: (req: { db?: unknown }, _res: unknown, next: () => void) => {
    req.db = { type: 'sqlite' };
    next();
  }
}));

const app = {
  get: (path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`GET:${path}`, handler);
  },
  post: (path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`POST:${path}`, handler);
  },
  put: (path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`PUT:${path}`, handler);
  },
  delete: (path: string, _middleware: unknown, handler: (req: unknown, res: unknown) => Promise<void>) => {
    routes.handlers.set(`DELETE:${path}`, handler);
  }
};

const invoke = async (method: string, path: string, request: Record<string, unknown>) => {
  const json = vi.fn();
  await routes.handlers.get(`${method}:${path}`)?.({ ...request, db: { type: 'sqlite' } }, { json });
};

describe('simple webserver controller bodies', () => {
  beforeEach(() => {
    routes.handlers.clear();
    Object.values(services).forEach(mock => mock.mockClear());
    initBusinessesController(app as never);
    initCategoriesController(app as never);
    initSettingsController(app as never);
  });

  it('forwards business, category, and settings requests', async () => {
    await invoke('GET', '/api/businesses', { query: { filter: 'active' } });
    await invoke('POST', '/api/businesses', { body: { id: 1, name: 'Acme' } });
    await invoke('PUT', '/api/businesses', { body: { id: 1, name: 'Updated' } });
    await invoke('DELETE', '/api/businesses/:id', { params: { id: '1' } });
    await invoke('POST', '/api/businesses/batch', { body: [{ id: 1 }] });

    await invoke('GET', '/api/categories', { query: { filter: 'active' } });
    await invoke('POST', '/api/categories', { body: { id: 2, name: 'Services' } });
    await invoke('PUT', '/api/categories', { body: { id: 2, name: 'Updated' } });
    await invoke('DELETE', '/api/categories/:id', { params: { id: '2' } });
    await invoke('POST', '/api/categories/batch', { body: [{ id: 2 }] });

    await invoke('GET', '/api/settings', {});
    await invoke('PUT', '/api/settings', { body: { language: 'en' } });

    expect(services.getAllBusinesses).toHaveBeenCalled();
    expect(services.batchAddBusiness).toHaveBeenCalled();
    expect(services.getAllCategories).toHaveBeenCalled();
    expect(services.batchAddCategory).toHaveBeenCalled();
    expect(services.getAllSettings).toHaveBeenCalled();
    expect(services.updateSettings).toHaveBeenCalledWith(expect.anything(), { language: 'en' });
  });
});
