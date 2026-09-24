import { initInvoiceSchedulesController } from '../invoiceSchedules';

const routes = vi.hoisted(() => ({
  handlers: new Map<string, (req: unknown, res: unknown) => Promise<void>>()
}));
const services = vi.hoisted(() => ({
  getAllInvoiceSchedules: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getInvoiceScheduleRuns: vi.fn().mockResolvedValue({ success: true, data: [] }),
  addInvoiceSchedule: vi.fn().mockResolvedValue({ success: true }),
  updateInvoiceSchedule: vi.fn().mockResolvedValue({ success: true }),
  deleteInvoiceSchedule: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../../../shared/services/invoiceSchedules', () => services);
vi.mock('../../utils/functions', () => ({
  parseFilter: vi.fn((value?: string) => (value ? JSON.parse(value) : undefined)),
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
  return json;
};

describe('invoice schedule webserver controller', () => {
  beforeEach(() => {
    routes.handlers.clear();
    Object.values(services).forEach(mock => mock.mockClear());
    initInvoiceSchedulesController(app as never);
  });

  it('forwards schedule CRUD and run-history requests', async () => {
    const filter = [{ type: 'Active', value: '' }];
    await invoke('GET', '/api/invoice-schedules', { query: { filter: JSON.stringify(filter) } });
    await invoke('GET', '/api/invoice-schedules/:id/runs', { params: { id: '7' } });
    await invoke('POST', '/api/invoice-schedules', { body: { sourceInvoiceId: 1 } });
    await invoke('PUT', '/api/invoice-schedules', { body: { id: 7, status: 'paused' } });
    await invoke('DELETE', '/api/invoice-schedules/:id', { params: { id: '7' } });

    expect(services.getAllInvoiceSchedules).toHaveBeenCalledWith(expect.anything(), filter);
    expect(services.getInvoiceScheduleRuns).toHaveBeenCalledWith(expect.anything(), 7);
    expect(services.addInvoiceSchedule).toHaveBeenCalledWith(expect.anything(), { sourceInvoiceId: 1 });
    expect(services.updateInvoiceSchedule).toHaveBeenCalledWith(expect.anything(), { id: 7, status: 'paused' });
    expect(services.deleteInvoiceSchedule).toHaveBeenCalledWith(expect.anything(), 7);
  });
});
