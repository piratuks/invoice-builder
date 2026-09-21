import { initBanksHandlers } from '../banks';
import { initSettingsHandlers } from '../settings';

const ipc = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => Promise<unknown>>(),
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => Promise<unknown>) => {
    ipc.handlers.set(channel, handler);
  })
}));

vi.mock('electron', () => ({ ipcMain: { handle: ipc.handle } }));

const serviceMocks = vi.hoisted(() => ({
  addBank: vi.fn().mockResolvedValue({ success: true }),
  updateBank: vi.fn().mockResolvedValue({ success: true }),
  deleteBank: vi.fn().mockResolvedValue({ success: true }),
  batchAddBank: vi.fn().mockResolvedValue({ success: true }),
  getAllBanks: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAllSettings: vi.fn().mockResolvedValue({ success: true, data: [] }),
  updateSettings: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../../../shared/services/banks', () => serviceMocks);
vi.mock('../../../shared/services/settings', () => serviceMocks);

describe('Electron IPC handlers', () => {
  const db = { query: vi.fn() } as never;

  beforeEach(() => {
    ipc.handlers.clear();
    ipc.handle.mockClear();
    Object.values(serviceMocks).forEach(mock => mock.mockClear());
  });

  it('registers and forwards bank channels', async () => {
    initBanksHandlers(db);
    const bank = { id: 4, name: 'Main bank' };

    await ipc.handlers.get('add-bank')?.({}, bank);
    await ipc.handlers.get('update-bank')?.({}, bank);
    await ipc.handlers.get('delete-bank')?.({}, 4);
    await ipc.handlers.get('batch-add-bank')?.({}, [bank]);
    await ipc.handlers.get('get-all-banks')?.({}, { active: true });

    expect(serviceMocks.addBank).toHaveBeenCalledWith(db, bank);
    expect(serviceMocks.updateBank).toHaveBeenCalledWith(db, bank);
    expect(serviceMocks.deleteBank).toHaveBeenCalledWith(db, 4);
    expect(serviceMocks.batchAddBank).toHaveBeenCalledWith(db, [bank]);
    expect(serviceMocks.getAllBanks).toHaveBeenCalledWith(db, { active: true });
  });

  it('registers and forwards settings channels', async () => {
    initSettingsHandlers(db);
    const settings = { id: 1, language: 'en' };

    await ipc.handlers.get('get-all-settings')?.();
    await ipc.handlers.get('update-settings')?.({}, settings);

    expect(serviceMocks.getAllSettings).toHaveBeenCalledWith(db);
    expect(serviceMocks.updateSettings).toHaveBeenCalledWith(db, settings);
  });
});
