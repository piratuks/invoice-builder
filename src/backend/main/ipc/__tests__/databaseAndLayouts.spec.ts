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
vi.mock('../../database', () => ({ setupDB: mocks.setupDB }));
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
    mocks.testPostgresConnection.mockResolvedValue(undefined);
  });

  it('returns save/open selections including canceled and empty selections', async () => {
    electron.showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:\\data\\invoice.db' });
    electron.showOpenDialog
      .mockResolvedValueOnce({ canceled: false, filePaths: ['C:\\data\\existing.db'] })
      .mockResolvedValueOnce({ canceled: true, filePaths: [] });
    initDBDialogsHandlers('company', {} as never);

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
    initDBDialogsHandlers('company', {} as never);
    const handler = electron.handlers.get('test-connection');

    await expect(handler?.({}, undefined)).resolves.toEqual({ success: true });
    mocks.testPostgresConnection.mockRejectedValueOnce(new Error('offline'));
    await expect(handler?.({}, { host: 'bad' })).resolves.toMatchObject({ success: false });
  });

  it('initializes create and open modes and maps setup failures', async () => {
    const mainWindow = {} as never;
    initDBDialogsHandlers('company', mainWindow);
    const handler = electron.handlers.get('initialize-db');

    await expect(
      handler?.({}, { fullPath: 'new.db', dbType: DatabaseType.sqlite, mode: DBInitType.create })
    ).resolves.toEqual({ success: true });
    expect(mocks.setupDB).toHaveBeenLastCalledWith(expect.objectContaining({ createIfMissing: true, mainWindow }));
    expect(electron.removeHandler).toHaveBeenCalledWith('open-url');

    await handler?.({}, { fullPath: 'old.db', dbType: DatabaseType.sqlite, mode: DBInitType.open });
    expect(mocks.setupDB).toHaveBeenLastCalledWith(expect.objectContaining({ createIfMissing: false }));

    mocks.setupDB.mockRejectedValueOnce(new Error('open failed'));
    await expect(handler?.({}, { dbType: DatabaseType.postgre })).resolves.toMatchObject({ success: false });
  });
});

describe('layout IPC handlers', () => {
  const db = { type: DatabaseType.sqlite } as DatabaseAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    electron.handlers.clear();
  });

  it('forwards CRUD channels to the layout service', async () => {
    initLayoutsHandlers(db);
    const layout = { id: 7, schema: {} };

    await electron.handlers.get('get-all-layouts')?.({}, ['active']);
    await electron.handlers.get('add-layout')?.({}, layout);
    await electron.handlers.get('update-layout')?.({}, layout);
    await electron.handlers.get('delete-layout')?.({}, 7);

    expect(mocks.getAllLayouts).toHaveBeenCalledWith(db, ['active']);
    expect(mocks.addLayout).toHaveBeenCalledWith(db, layout);
    expect(mocks.updateLayout).toHaveBeenCalledWith(db, layout);
    expect(mocks.deleteLayout).toHaveBeenCalledWith(db, 7);
  });

  it('returns unsuccessful exports and canceled save dialogs without writing', async () => {
    initLayoutsHandlers(db);
    const handler = electron.handlers.get('export-layout');
    mocks.exportLayout.mockResolvedValueOnce({ success: false }).mockResolvedValueOnce({ success: true });

    await expect(handler?.({}, 1)).resolves.toEqual({ success: false });
    await expect(handler?.({}, 2)).resolves.toEqual({ success: true });

    mocks.exportLayout.mockResolvedValue({ success: true, data: { schema: { meta: { name: 'Layout' } } } });
    electron.showSaveDialog.mockResolvedValue({ canceled: true });
    await expect(handler?.({}, 3)).resolves.toEqual({ success: false });
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('sanitizes the export name, writes JSON, and maps write failures', async () => {
    initLayoutsHandlers(db);
    const handler = electron.handlers.get('export-layout');
    mocks.exportLayout.mockResolvedValue({ success: true, data: { schema: { meta: { name: 'A/B:*?' } } } });
    electron.showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:\\tmp\\layout.json' });
    mocks.writeFile.mockResolvedValue(undefined);

    await expect(handler?.({}, 4)).resolves.toEqual({
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
    await expect(handler?.({}, 5)).resolves.toEqual({ success: false });

    electron.showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'layout.json' });
    mocks.writeFile.mockRejectedValue(new Error('disk full'));
    await expect(handler?.({}, 6)).resolves.toMatchObject({ success: false });
  });
});
