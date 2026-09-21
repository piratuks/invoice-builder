import { initIpcHandler } from '../index';

const ipc = vi.hoisted(() => ({ handle: vi.fn() }));
const shell = vi.hoisted(() => ({ openExternal: vi.fn().mockResolvedValue(undefined) }));
const initializers = vi.hoisted(() => ({
  autoUpdater: vi.fn(),
  banks: vi.fn(),
  businesses: vi.fn(),
  categories: vi.fn(),
  clients: vi.fn(),
  currencies: vi.fn(),
  importExport: vi.fn(),
  invoices: vi.fn(),
  items: vi.fn(),
  layouts: vi.fn(),
  presets: vi.fn(),
  receipt: vi.fn(),
  settings: vi.fn(),
  styleProfiles: vi.fn(),
  units: vi.fn()
}));

vi.mock('electron', () => ({ ipcMain: ipc, shell }));
vi.mock('../autoUpdater', () => ({ initAutoUpdaterHandlers: initializers.autoUpdater }));
vi.mock('../banks', () => ({ initBanksHandlers: initializers.banks }));
vi.mock('../businesses', () => ({ initBusinessesHandlers: initializers.businesses }));
vi.mock('../categories', () => ({ initCategoriesHandlers: initializers.categories }));
vi.mock('../clients', () => ({ initClientsHandlers: initializers.clients }));
vi.mock('../currencies', () => ({ initCurrenciesHandlers: initializers.currencies }));
vi.mock('../importExport', () => ({ initImportExportHandlers: initializers.importExport }));
vi.mock('../invoices', () => ({ initInvoicesHandlers: initializers.invoices }));
vi.mock('../items', () => ({ initItemsHandlers: initializers.items }));
vi.mock('../layouts', () => ({ initLayoutsHandlers: initializers.layouts }));
vi.mock('../presets', () => ({ initPresetHandlers: initializers.presets }));
vi.mock('../receipt', () => ({ initReceiptHandlers: initializers.receipt }));
vi.mock('../settings', () => ({ initSettingsHandlers: initializers.settings }));
vi.mock('../styleProfiles', () => ({ initStyleProfilesHandlers: initializers.styleProfiles }));
vi.mock('../units', () => ({ initUnitsHandlers: initializers.units }));

describe('Electron IPC registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an unavailable database', () => {
    expect(() => initIpcHandler(undefined as never, {} as never)).toThrow('error.databaseNotInitialized');
  });

  it('registers the URL handler and every module initializer', async () => {
    const db = { query: vi.fn() } as never;
    const window = {} as never;
    initIpcHandler(db, window);

    expect(ipc.handle).toHaveBeenCalledWith('open-url', expect.any(Function));
    Object.values(initializers).forEach(initializer => expect(initializer).toHaveBeenCalled());

    const openUrl = ipc.handle.mock.calls[0][1] as (_event: unknown, url: string) => Promise<void>;
    await openUrl({}, 'https://example.test');
    expect(shell.openExternal).toHaveBeenCalledWith('https://example.test');
  });
});
