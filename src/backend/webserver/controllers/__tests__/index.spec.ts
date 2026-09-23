import { initControllers } from '../index';

const calls = vi.hoisted(() => ({
  banks: vi.fn(),
  businesses: vi.fn(),
  categories: vi.fn(),
  clients: vi.fn(),
  currencies: vi.fn(),
  importExport: vi.fn(),
  invoiceSchedules: vi.fn(),
  invoices: vi.fn(),
  items: vi.fn(),
  layouts: vi.fn(),
  presets: vi.fn(),
  settings: vi.fn(),
  styleProfiles: vi.fn(),
  units: vi.fn()
}));

vi.mock('../banks', () => ({ initBanksController: calls.banks }));
vi.mock('../businesses', () => ({ initBusinessesController: calls.businesses }));
vi.mock('../categories', () => ({ initCategoriesController: calls.categories }));
vi.mock('../clients', () => ({ initClientsController: calls.clients }));
vi.mock('../currencies', () => ({ initCurrenciesController: calls.currencies }));
vi.mock('../importExport', () => ({ initImportExportController: calls.importExport }));
vi.mock('../invoiceSchedules', () => ({ initInvoiceSchedulesController: calls.invoiceSchedules }));
vi.mock('../invoices', () => ({ initInvoicesController: calls.invoices }));
vi.mock('../items', () => ({ initItemsController: calls.items }));
vi.mock('../layouts', () => ({ initLayoutsController: calls.layouts }));
vi.mock('../presets', () => ({ initPresetsController: calls.presets }));
vi.mock('../settings', () => ({ initSettingsController: calls.settings }));
vi.mock('../styleProfiles', () => ({ initStyleProfilesController: calls.styleProfiles }));
vi.mock('../units', () => ({ initUnitsController: calls.units }));

const app = {};

describe('webserver controller registration', () => {
  it('initializes every controller with the Express app', () => {
    initControllers(app as never);

    Object.values(calls).forEach(controller => {
      expect(controller).toHaveBeenCalledWith(app);
    });
  });
});
