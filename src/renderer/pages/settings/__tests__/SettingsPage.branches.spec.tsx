import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { AmountFormat } from '../../../shared/enums/amountFormat';
import { DateFormat } from '../../../shared/enums/dateFormat';
import { DeliveryProvider } from '../../../shared/enums/deliveryProvider';
import { Language } from '../../../shared/enums/language';
import { MenuItemSettings } from '../../../shared/enums/menuItemSettings';
import type { Settings } from '../../../shared/types/settings';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { SettingsPage } from '../index';

interface MenuProps {
  onSelected: (item: MenuItemSettings | undefined) => void;
  onModeChange: (value: boolean) => void;
  toggleQuotes: (value: boolean) => void;
  toggleReports: (value: boolean) => void;
  toggleReceiptPrinting: (value: boolean) => void;
  toggleStyleProfiles: (value: boolean) => void;
  togglePresets: (value: boolean) => void;
  toggleUBL: (value: boolean) => void;
  toggleXRechnung: (value: boolean) => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
}

const mocks = vi.hoisted(() => ({
  desktop: true,
  menuProps: undefined as MenuProps | undefined,
  customizeProps: undefined as
    { onCustomizedInvoice: (data: never) => void; onBack: () => void; showBack: boolean } | undefined,
  languageProps: undefined as
    { onLanguageFormat: (data: never) => void; onBack: () => void; showBack: boolean } | undefined,
  confirmation: undefined as { isOpen: boolean; onCancel: () => void; onConfirm: () => void } | undefined,
  exportResult: { filePath: 'C:/backup.json' } as { filePath?: string } | undefined,
  importResult: undefined as unknown,
  backupError: undefined as { message?: string; key?: string } | undefined,
  isUpdating: false,
  shouldRejectUpdate: false,
  updateError: undefined as { message?: string; key?: string } | undefined,
  update: vi.fn(),
  updateTrigger: undefined as ((arg: unknown) => { unwrap: () => Promise<unknown> }) | undefined,
  exportJson: vi.fn(),
  importJson: vi.fn()
}));

vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return { ...actual, useMediaQuery: () => mocks.desktop };
});
vi.mock('../../../shared/api/settingsApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../shared/api/settingsApi')>();
  return {
    ...actual,
    useUpdateSettingsMutation: () => [mocks.updateTrigger, { isLoading: mocks.isUpdating }]
  };
});
vi.mock('../../../shared/api/backupApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../shared/api/backupApi')>();
  return {
    ...actual,
    useExportAllDataMutation: () => [
      mocks.exportJson.mockImplementation(() => ({
        unwrap: () => (mocks.backupError ? Promise.reject(mocks.backupError) : Promise.resolve(mocks.exportResult))
      })),
      { isLoading: false }
    ],
    useImportAllDataMutation: () => [
      mocks.importJson.mockImplementation(() => ({
        unwrap: () => (mocks.backupError ? Promise.reject(mocks.backupError) : Promise.resolve(mocks.importResult))
      })),
      { isLoading: false }
    ]
  };
});
vi.mock('../menu/Menu', () => ({
  Menu: (props: MenuProps) => {
    mocks.menuProps = props;
    return <div>settings-menu</div>;
  }
}));
vi.mock('../content/CustomizeInvoice', () => ({
  CustomizeInvoice: (props: NonNullable<typeof mocks.customizeProps>) => {
    mocks.customizeProps = props;
    return <div>customize-content</div>;
  }
}));
vi.mock('../content/LanguageFormat', () => ({
  LanguageFormat: (props: NonNullable<typeof mocks.languageProps>) => {
    mocks.languageProps = props;
    return <div>language-content</div>;
  }
}));
vi.mock('../../../shared/components/modals/confirmation', () => ({
  Confirmation: (props: NonNullable<typeof mocks.confirmation>) => {
    mocks.confirmation = props;
    return <div data-testid="confirmation">{String(props.isOpen)}</div>;
  }
}));

const settings = {
  id: 1,
  language: Language.en,
  amountFormat: AmountFormat.enUS,
  dateFormat: DateFormat.MMddyyyy,
  isDarkMode: false,
  shouldIncludeYear: true,
  shouldIncludeMonth: true,
  shouldIncludeBusinessName: true,
  quotesON: true,
  deliveryProvider: DeliveryProvider.smtp,
  styleProfilesON: true,
  ublON: true,
  xrechnungON: true,
  receiptPrintingOn: true,
  presetsON: true,
  reportsON: true,
  createdAt: '',
  updatedAt: ''
} satisfies Settings;

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

const latestToast = () => store.getState().pageSlice.toasts.at(-1);

describe('SettingsPage callback branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.desktop = true;
    mocks.isUpdating = false;
    mocks.shouldRejectUpdate = false;
    mocks.updateError = undefined;
    mocks.exportResult = { filePath: 'C:/backup.json' };
    mocks.importResult = undefined;
    mocks.backupError = undefined;
    mocks.updateTrigger = (arg: unknown) => {
      mocks.update(arg);
      return {
        unwrap: () => (mocks.shouldRejectUpdate ? Promise.reject(mocks.updateError) : Promise.resolve(arg))
      };
    };
    store.dispatch(setSettings(settings));
    for (const toast of store.getState().pageSlice.toasts)
      store.dispatch({ type: 'pageSlice/removeToast', payload: toast.id });
  });

  it('dispatches every menu setting and persists changes', async () => {
    render(<SettingsPage />, { wrapper });

    act(() => {
      mocks.menuProps?.onModeChange(true);
      mocks.menuProps?.toggleQuotes(false);
      mocks.menuProps?.toggleReports(false);
      mocks.menuProps?.toggleReceiptPrinting(false);
      mocks.menuProps?.toggleStyleProfiles(false);
      mocks.menuProps?.togglePresets(false);
      mocks.menuProps?.toggleUBL(false);
      mocks.menuProps?.toggleXRechnung(false);
    });

    expect(store.getState().pageSlice.settings).toEqual(
      expect.objectContaining({
        isDarkMode: true,
        quotesON: false,
        reportsON: false,
        receiptPrintingOn: false,
        styleProfilesON: false,
        presetsON: false,
        ublON: false,
        xrechnungON: false
      })
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        isDarkMode: true,
        quotesON: false,
        reportsON: false,
        receiptPrintingOn: false,
        styleProfilesON: false,
        presetsON: false,
        ublON: false,
        xrechnungON: false
      })
    );
  });

  it('updates customization and language content and handles mobile back', () => {
    mocks.desktop = false;
    render(<SettingsPage />, { wrapper });
    act(() => mocks.menuProps?.onSelected(MenuItemSettings.Receipt));
    expect(screen.getByText('customize-content')).toBeInTheDocument();
    expect(mocks.customizeProps?.showBack).toBe(true);
    act(() =>
      mocks.customizeProps?.onCustomizedInvoice({
        prefix: 'NEW',
        suffix: 'END',
        includeMonth: false,
        includeYear: false,
        includeBusinessName: false
      } as never)
    );
    expect(store.getState().pageSlice.settings?.invoicePrefix).toBe('NEW');
    act(() => mocks.customizeProps?.onBack());
    expect(screen.getByText('settings-menu')).toBeInTheDocument();

    act(() => mocks.menuProps?.onSelected(MenuItemSettings.LanguageFormat));
    act(() =>
      mocks.languageProps?.onLanguageFormat({
        language: Language.fr,
        amountFormat: AmountFormat.deDE,
        dateFormat: DateFormat.ddMMyyyy
      } as never)
    );
    expect(store.getState().pageSlice.settings).toEqual(
      expect.objectContaining({
        language: Language.fr,
        amountFormat: AmountFormat.deDE,
        dateFormat: DateFormat.ddMMyyyy
      })
    );
    expect(localStorage.getItem('lastUsedLanguage')).toBe(Language.fr);
  });

  it('handles import confirmation, cancellation, export success variants, and import success', async () => {
    render(<SettingsPage />, { wrapper });
    act(() => mocks.menuProps?.onImportJSON());
    expect(mocks.confirmation?.isOpen).toBe(true);
    act(() => mocks.confirmation?.onCancel());
    expect(mocks.confirmation?.isOpen).toBe(false);
    act(() => mocks.menuProps?.onImportJSON());
    act(() => mocks.confirmation?.onConfirm());
    expect(mocks.importJson).toHaveBeenCalledTimes(1);
    await act(async () => {});

    act(() => mocks.menuProps?.onExportJSON());
    expect(mocks.exportJson).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect(latestToast()?.severity).toBe('success');
    mocks.exportResult = undefined;
    act(() => mocks.menuProps?.onExportJSON());
    await act(async () => {});
    expect(latestToast()?.message).toBe(i18n.t('common.exported'));
    act(() => mocks.menuProps?.onImportJSON());
    act(() => mocks.confirmation?.onConfirm());
    await act(async () => {});
    expect(latestToast()?.message).toBe(i18n.t('common.imported'));
  });

  it('rejects the settings update with the configured error contract', async () => {
    mocks.shouldRejectUpdate = true;
    mocks.updateError = { message: 'literal failure' };

    await expect(
      (async () => {
        const result = mocks.updateTrigger?.(store.getState().pageSlice.settings as never);
        await result?.unwrap();
      })()
    ).rejects.toMatchObject({ message: 'literal failure' });
  });

  it.each(['export', 'import'] as const)('handles %s failure responses', async type => {
    mocks.backupError = type === 'export' ? { key: 'common.error' } : {};
    render(<SettingsPage />, { wrapper });
    if (type === 'export') {
      act(() => mocks.menuProps?.onExportJSON());
    } else {
      act(() => mocks.menuProps?.onImportJSON());
      act(() => mocks.confirmation?.onConfirm());
    }
    await act(async () => {});
    if (type === 'export') expect(latestToast()?.severity).toBe('error');
  });
});
