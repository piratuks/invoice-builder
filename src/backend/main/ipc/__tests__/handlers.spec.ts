import { initBanksHandlers } from '../banks';
import { initInvoiceSchedulesHandlers } from '../invoiceSchedules';
import { initSettingsHandlers } from '../settings';

const ipc = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => Promise<unknown>>(),
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => Promise<unknown>) => {
    ipc.handlers.set(channel, handler);
  })
}));

const database = vi.hoisted(() => ({ requireDatabase: vi.fn() }));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: vi.fn() },
  ipcMain: { handle: ipc.handle }
}));
vi.mock('../../database', () => database);

const serviceMocks = vi.hoisted(() => ({
  addBank: vi.fn().mockResolvedValue({ success: true }),
  updateBank: vi.fn().mockResolvedValue({ success: true }),
  deleteBank: vi.fn().mockResolvedValue({ success: true }),
  batchAddBank: vi.fn().mockResolvedValue({ success: true }),
  getAllBanks: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAllSettings: vi.fn().mockResolvedValue({ success: true, data: [] }),
  updateSettings: vi.fn().mockResolvedValue({ success: true }),
  getAllInvoiceSchedules: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getInvoiceScheduleRuns: vi.fn().mockResolvedValue({ success: true, data: [] }),
  addInvoiceSchedule: vi.fn().mockResolvedValue({ success: true }),
  updateInvoiceSchedule: vi.fn().mockResolvedValue({ success: true }),
  deleteInvoiceSchedule: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../../../shared/services/banks', () => serviceMocks);
vi.mock('../../../shared/services/invoiceSchedules', () => serviceMocks);
vi.mock('../../../shared/services/settings', () => serviceMocks);

describe('Electron IPC handlers', () => {
  const db = { query: vi.fn() };

  beforeEach(() => {
    ipc.handlers.clear();
    ipc.handle.mockClear();
    database.requireDatabase.mockReturnValue(db);
    Object.values(serviceMocks).forEach(mock => mock.mockClear());
  });

  it('registers and forwards bank channels', async () => {
    initBanksHandlers();
    const bank = { id: 4, name: 'Main bank' };
    const event = { sender: { id: 1 } };

    await ipc.handlers.get('add-bank')?.(event, bank);
    await ipc.handlers.get('update-bank')?.(event, bank);
    await ipc.handlers.get('delete-bank')?.(event, 4);
    await ipc.handlers.get('batch-add-bank')?.(event, [bank]);
    await ipc.handlers.get('get-all-banks')?.(event, { active: true });

    expect(serviceMocks.addBank).toHaveBeenCalledWith(db, bank);
    expect(serviceMocks.updateBank).toHaveBeenCalledWith(db, bank);
    expect(serviceMocks.deleteBank).toHaveBeenCalledWith(db, 4);
    expect(serviceMocks.batchAddBank).toHaveBeenCalledWith(db, [bank]);
    expect(serviceMocks.getAllBanks).toHaveBeenCalledWith(db, { active: true });
  });

  it('registers and forwards settings channels', async () => {
    initSettingsHandlers();
    const settings = { id: 1, language: 'en' };
    const event = { sender: { id: 1 } };

    await ipc.handlers.get('get-all-settings')?.(event);
    await ipc.handlers.get('update-settings')?.(event, settings);

    expect(serviceMocks.getAllSettings).toHaveBeenCalledWith(db);
    expect(serviceMocks.updateSettings).toHaveBeenCalledWith(db, settings);
  });

  it('registers and forwards invoice schedule channels', async () => {
    initInvoiceSchedulesHandlers();
    const schedule = { id: 7, sourceInvoiceId: 3 };
    const filter = [{ type: 'Active', value: '' }];
    const event = { sender: { id: 1 } };

    await ipc.handlers.get('get-all-invoice-schedules')?.(event, filter);
    await ipc.handlers.get('get-invoice-schedule-runs')?.(event, 7);
    await ipc.handlers.get('add-invoice-schedule')?.(event, schedule);
    await ipc.handlers.get('update-invoice-schedule')?.(event, schedule);
    await ipc.handlers.get('delete-invoice-schedule')?.(event, 7);

    expect(serviceMocks.getAllInvoiceSchedules).toHaveBeenCalledWith(db, filter);
    expect(serviceMocks.getInvoiceScheduleRuns).toHaveBeenCalledWith(db, 7);
    expect(serviceMocks.addInvoiceSchedule).toHaveBeenCalledWith(db, schedule);
    expect(serviceMocks.updateInvoiceSchedule).toHaveBeenCalledWith(db, schedule);
    expect(serviceMocks.deleteInvoiceSchedule).toHaveBeenCalledWith(db, 7);
  });
});
