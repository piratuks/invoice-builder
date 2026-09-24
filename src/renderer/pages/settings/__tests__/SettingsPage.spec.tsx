import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import type { Settings } from '../../../shared/types/settings';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { SettingsPage } from '../index';

vi.mock('../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    (() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }));
  vi.spyOn(window, 'matchMedia').mockImplementation(
    query =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as unknown as MediaQueryList
  );
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('SettingsPage', () => {
  const mockApi = {
    getAllSettings: vi.fn(),
    updateSettings: vi.fn(),
    exportAllData: vi.fn(),
    importAllData: vi.fn(),
    openUrl: vi.fn(),
    checkForUpdates: vi.fn(),
    getSmtpPasswordStatus: vi.fn(),
    setSmtpPassword: vi.fn(),
    deleteSmtpPassword: vi.fn()
  };

  const baseSettings = {
    id: 1,
    language: 'en',
    amountFormat: 'en-US',
    dateFormat: 'MM/dd/yyyy',
    isDarkMode: false,
    shouldIncludeYear: true,
    shouldIncludeMonth: true,
    shouldIncludeBusinessName: true,
    quotesON: true,
    invoiceSchedulesON: true,
    styleProfilesON: true,
    ublON: true,
    xrechnungON: true,
    receiptPrintingOn: true,
    presetsON: true,
    reportsON: true,
    createdAt: '',
    updatedAt: ''
  } as Settings;

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(setSettings(baseSettings));
    mockApi.getAllSettings.mockResolvedValue({ success: true, data: {} });
    mockApi.updateSettings.mockResolvedValue({ success: true, data: {} });
    mockApi.getSmtpPasswordStatus.mockResolvedValue({ success: true, data: { configured: false, source: 'env' } });
    mockApi.setSmtpPassword.mockResolvedValue({ success: true });
    mockApi.deleteSmtpPassword.mockResolvedValue({ success: true });
    mockApi.exportAllData.mockResolvedValue({ success: true, data: { filePath: '/tmp/export.json' } });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('shows the empty right column by default', () => {
    render(<SettingsPage />, { wrapper });

    expect(screen.getByText(i18n.t('app.noItems'))).toBeInTheDocument();
  });

  it('shows the language & format content when that menu item is selected', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />, { wrapper });

    await user.click(screen.getByText(i18n.t('settingsMenuItems.titles.languageFormat')));

    expect(screen.queryByText(i18n.t('app.noItems'))).not.toBeInTheDocument();
  });

  it('shows the customize invoice content when that menu item is selected', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />, { wrapper });

    await user.click(screen.getByText(i18n.t('settingsMenuItems.titles.customizeInvoice')));

    expect(screen.queryByText(i18n.t('app.noItems'))).not.toBeInTheDocument();
  });

  it('shows the delivery settings content when that menu item is selected', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />, { wrapper });

    await user.click(screen.getByText(i18n.t('settingsMenuItems.titles.deliverySettings')));

    expect(screen.getByLabelText(i18n.t('deliverySettings.smtpHost'))).toBeInTheDocument();
  });

  it('exports a JSON backup when requested', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />, { wrapper });

    await user.click(screen.getByText(i18n.t('settingsMenuItems.titles.export')));

    await waitFor(() => expect(mockApi.exportAllData).toHaveBeenCalled());
  });

  it('imports a JSON backup after confirming', async () => {
    const user = userEvent.setup();
    mockApi.importAllData.mockResolvedValue({ success: true, data: {} });
    render(<SettingsPage />, { wrapper });

    await user.click(screen.getByText(i18n.t('settingsMenuItems.titles.import')));
    await user.click(screen.getByRole('button', { name: i18n.t('common.confirm') }));

    await waitFor(() => expect(mockApi.importAllData).toHaveBeenCalled());
  });

  it.each([
    'turnQuotes',
    'turnInvoiceSchedules',
    'turnReports',
    'turnStyleProfiles',
    'turnPresets',
    'turnUBL',
    'turnXRechnung',
    'turnReceiptPrinting'
  ])('toggles the %s setting and persists the change', async key => {
    const user = userEvent.setup();
    render(<SettingsPage />, { wrapper });

    await user.click(screen.getByText(i18n.t(`settingsMenuItems.titles.${key}`)));

    await waitFor(() => expect(mockApi.updateSettings).toHaveBeenCalled());
  });
});
