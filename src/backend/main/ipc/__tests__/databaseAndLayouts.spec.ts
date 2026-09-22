import { DatabaseType } from '../../../shared/enums/databaseType';
import { DBInitType } from '../../../shared/enums/dbInitType';
import type { DatabaseAdapter } from '../../../shared/types/DatabaseAdapter';
import { initDBDialogsHandlers } from '../dbDialogs';
import { initLayoutsHandlers } from '../layouts';

const electron = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => Promise<unknown>>(),
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => Promise<unknown>) => {
    electron.handlers.set(channel, handler);
  }),
  removeHandler: vi.fn(),
  showSaveDialog: vi.fn(),
  showOpenDialog: vi.fn()
}));
const mocks = vi.hoisted(() => ({
  testPostgresConnection: vi.fn(),
  setupDB: vi.fn(),
  requireDatabase: vi.fn(),
  writeFile: vi.fn(),
  getAllLayouts: vi.fn(),
  addLayout: vi.fn(),
  updateLayout: vi.fn(),
  deleteLayout: vi.fn(),
  exportLayout: vi.fn()
}));

vi.mock('electron', () => ({
  BrowserWindow: class {},
  dialog: { showSaveDialog: electron.showSaveDialog, showOpenDialog: electron.showOpenDialog },
  ipcMain: { handle: electron.handle, removeHandler: electron.removeHandler }
}));
vi.mock('fs', () => ({
  default: { promises: { writeFile: mocks.writeFile } },
  promises: { writeFile: mocks.writeFile }
}));
vi.mock('../../../shared/db/setup', () => ({ testPostgresConnection: mocks.testPostgresConnection }));
vi.mock('../../database', () => ({ setupDB: mocks.setupDB, requireDatabase: mocks.requireDatabase }));
vi.mock('../../../shared/services/layouts', () => ({
  getAllLayouts: mocks.getAllLayouts,
  addLayout: mocks.addLayout,
  updateLayout: mocks.updateLayout,
  deleteLayout: mocks.deleteLayout,
  exportLayout: mocks.exportLayout
}));

describe('database dialog IPC handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    electron.handlers.clear();
    mocks.setupDB.mockResolvedValue(undefined);
    mocks.requireDatabase.mockReturnValue({ type: DatabaseType.sqlite });
    mocks.testPostgresConnection.mockResolvedValue(undefined);
  });

  it('returns save/open selections including canceled and empty selections', async () => {
    electron.showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:\\data\\invoice.db' });
    electron.showOpenDialog
      .mockResolvedValueOnce({ canceled: false, filePaths: ['C:\\data\\existing.db'] })
      .mockResolvedValueOnce({ canceled: true, filePaths: [] });
    initDBDialogsHandlers('company');

    await expect(electron.handlers.get('show-save-db-dialog')?.()).resolves.toMatchObject({
      success: true,
      data: { canceled: false, filePath: 'C:\\data\\invoice.db' }
    });
    await expect(electron.handlers.get('show-open-db-dialog')?.()).resolves.toMatchObject({
      data: { filePath: 'C:\\data\\existing.db' }
    });
    await expect(electron.handlers.get('show-open-db-dialog')?.()).resolves.toMatchObject({
      data: { canceled: true, filePath: undefined }
    });
  });

  it('reports connection success and mapped failure', async () => {
    initDBDialogsHandlers('company');
    const handler = electron.handlers.get('test-connection');

    await expect(handler?.({}, undefined)).resolves.toEqual({ success: true });
    mocks.testPostgresConnection.mockRejectedValueOnce(new Error('offline'));
    await expect(handler?.({}, { host: 'bad' })).resolves.toMatchObject({ success: false });
  });

  it('initializes create and open modes and maps setup failures', async () => {
    initDBDialogsHandlers('company');
    const handler = electron.handlers.get('initialize-db');

    await expect(
      handler?.({ sender: { id: 1 } }, { fullPath: 'new.db', dbType: DatabaseType.sqlite, mode: DBInitType.create })
    ).resolves.toEqual({ success: true });
    expect(mocks.setupDB).toHaveBeenLastCalledWith(expect.objectContaining({ createIfMissing: true, windowId: 1 }));

    await handler?.({ sender: { id: 1 } }, { fullPath: 'old.db', dbType: DatabaseType.sqlite, mode: DBInitType.open });
    expect(mocks.setupDB).toHaveBeenLastCalledWith(expect.objectContaining({ createIfMissing: false }));

    mocks.setupDB.mockRejectedValueOnce(new Error('open failed'));
    await expect(handler?.({ sender: { id: 1 } }, { dbType: DatabaseType.postgre })).resolves.toMatchObject({
      success: false
    });
  });
});

describe('layout IPC handlers', () => {
  const db = { type: DatabaseType.sqlite } as DatabaseAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    electron.handlers.clear();
    mocks.requireDatabase.mockReturnValue(db);
  });

  it('forwards CRUD channels to the layout service', async () => {
    initLayoutsHandlers();
    const layout = { id: 7, schema: {} };

    await electron.handlers.get('get-all-layouts')?.({ sender: { id: 1 } }, ['active']);
    await electron.handlers.get('add-layout')?.({ sender: { id: 1 } }, layout);
    await electron.handlers.get('update-layout')?.({ sender: { id: 1 } }, layout);
    await electron.handlers.get('delete-layout')?.({ sender: { id: 1 } }, 7);

    expect(mocks.getAllLayouts).toHaveBeenCalledWith(db, ['active']);
    expect(mocks.addLayout).toHaveBeenCalledWith(db, layout);
    expect(mocks.updateLayout).toHaveBeenCalledWith(db, layout);
    expect(mocks.deleteLayout).toHaveBeenCalledWith(db, 7);
  });

  it('returns unsuccessful exports and canceled save dialogs without writing', async () => {
    initLayoutsHandlers();
    const handler = electron.handlers.get('export-layout');
    mocks.exportLayout.mockResolvedValueOnce({ success: false }).mockResolvedValueOnce({ success: true });

    await expect(handler?.({ sender: { id: 1 } }, 1)).resolves.toEqual({ success: false });
    await expect(handler?.({ sender: { id: 1 } }, 2)).resolves.toEqual({ success: true });

    mocks.exportLayout.mockResolvedValue({ success: true, data: { schema: { meta: { name: 'Layout' } } } });
    electron.showSaveDialog.mockResolvedValue({ canceled: true });
    await expect(handler?.({ sender: { id: 1 } }, 3)).resolves.toEqual({ success: false });
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('sanitizes the export name, writes JSON, and maps write failures', async () => {
    initLayoutsHandlers();
    const handler = electron.handlers.get('export-layout');
    mocks.exportLayout.mockResolvedValue({ success: true, data: { schema: { meta: { name: 'A/B:*?' } } } });
    electron.showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:\\tmp\\layout.json' });
    mocks.writeFile.mockResolvedValue(undefined);

    await expect(handler?.({ sender: { id: 1 } }, 4)).resolves.toEqual({
      success: true,
      data: { filePath: 'C:\\tmp\\layout.json' }
    });
    expect(electron.showSaveDialog).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPath: expect.stringContaining('A_B___.json') })
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      'C:\\tmp\\layout.json',
      JSON.stringify({ meta: { name: 'A/B:*?' } }, null, 2),
      'utf8'
    );

    mocks.exportLayout.mockResolvedValue({ success: true, data: { schema: { meta: { name: '***' } } } });
    electron.showSaveDialog.mockResolvedValue({ canceled: false, filePath: undefined });
    await expect(handler?.({ sender: { id: 1 } }, 5)).resolves.toEqual({ success: false });

    electron.showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'layout.json' });
    mocks.writeFile.mockRejectedValue(new Error('disk full'));
    await expect(handler?.({ sender: { id: 1 } }, 6)).resolves.toMatchObject({ success: false });
  });
});
