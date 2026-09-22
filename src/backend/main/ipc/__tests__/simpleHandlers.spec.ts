import { initBusinessesHandlers } from '../businesses';
import { initCategoriesHandlers } from '../categories';
import { initClientsHandlers } from '../clients';
import { initCurrenciesHandlers } from '../currencies';
import { initItemsHandlers } from '../items';
import { initPresetHandlers } from '../presets';
import { initSettingsHandlers } from '../settings';
import { initStyleProfilesHandlers } from '../styleProfiles';
import { initUnitsHandlers } from '../units';

const registered = vi.hoisted(() => ({ channels: [] as string[] }));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: vi.fn() },
  ipcMain: {
    handle: (channel: string) => registered.channels.push(channel)
  }
}));

vi.mock('../../../shared/services/businesses', () => ({}));
vi.mock('../../../shared/services/categories', () => ({}));
vi.mock('../../../shared/services/clients', () => ({}));
vi.mock('../../../shared/services/currencies', () => ({}));
vi.mock('../../../shared/services/items', () => ({}));
vi.mock('../../../shared/services/presets', () => ({}));
vi.mock('../../../shared/services/settings', () => ({}));
vi.mock('../../../shared/services/styleProfiles', () => ({}));
vi.mock('../../../shared/services/units', () => ({}));

describe('simple Electron IPC registrations', () => {
  beforeEach(() => {
    registered.channels.length = 0;
  });

  it('registers CRUD handlers for simple entities', () => {
    initBusinessesHandlers();
    initCategoriesHandlers();
    initClientsHandlers();
    initCurrenciesHandlers();
    initItemsHandlers();
    initPresetHandlers();
    initSettingsHandlers();
    initStyleProfilesHandlers();
    initUnitsHandlers();

    expect(registered.channels.length).toBeGreaterThan(30);
    expect(registered.channels).toContain('get-all-businesses');
    expect(registered.channels).toContain('batch-add-unit');
    expect(registered.channels).toContain('update-settings');
  });
});
