import { act, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { AmountFormat } from '../../../shared/enums/amountFormat';
import { DateFormat } from '../../../shared/enums/dateFormat';
import { Language } from '../../../shared/enums/language';
import { MenuItemSettings } from '../../../shared/enums/menuItemSettings';
import type { Response } from '../../../shared/types/response';
import type { Settings } from '../../../shared/types/settings';
import { store } from '../../../state/configureStore';
import { setSettings } from '../../../state/pageSlice';
import { SettingsPage } from '../index';

interface HookOptions<T> {
  onDone: (data: Response<T>) => void;
}

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
  retrieveOptions: undefined as HookOptions<Settings> | undefined,
  updateOptions: undefined as HookOptions<unknown> | undefined,
  exportOptions: undefined as HookOptions<{ filePath?: string }> | undefined,
  importOptions: undefined as HookOptions<unknown> | undefined,
  getSettings: vi.fn(),
  update: vi.fn(),
  exportJson: vi.fn(),
  importJson: vi.fn()
}));

vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return { ...actual, useMediaQuery: () => mocks.desktop };
});
vi.mock('../../../shared/hooks/settings/useSettingsRetrieve', () => ({
  useSettingsRetrieve: (options: HookOptions<Settings>) => {
    mocks.retrieveOptions = options;
    return { execute: mocks.getSettings };
  }
}));
vi.mock('../../../shared/hooks/settings/useSettingsUpdate', () => ({
  useSettingsUpdate: (options: HookOptions<unknown>) => {
    mocks.updateOptions = options;
    return { execute: mocks.update };
  }
}));
vi.mock('../../../shared/hooks/backup/useExportJson', () => ({
  useExportJson: (options: HookOptions<{ filePath?: string }>) => {
    mocks.exportOptions = options;
    return { execute: mocks.exportJson };
  }
}));
vi.mock('../../../shared/hooks/backup/useImportJson', () => ({
  useImportJson: (options: HookOptions<unknown>) => {
    mocks.importOptions = options;
    return { execute: mocks.importJson };
  }
}));
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
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
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

  it('handles import confirmation, cancellation, export success variants, and import success', () => {
    render(<SettingsPage />, { wrapper });
    act(() => mocks.menuProps?.onImportJSON());
    expect(mocks.confirmation?.isOpen).toBe(true);
    act(() => mocks.confirmation?.onCancel());
    expect(mocks.confirmation?.isOpen).toBe(false);
    act(() => mocks.menuProps?.onImportJSON());
    act(() => mocks.confirmation?.onConfirm());
    expect(mocks.importJson).toHaveBeenCalledTimes(1);

    act(() => mocks.menuProps?.onExportJSON());
    expect(mocks.exportJson).toHaveBeenCalledTimes(1);
    act(() => mocks.exportOptions?.onDone({ success: true, data: { filePath: 'C:/backup.json' } }));
    expect(latestToast()?.severity).toBe('success');
    act(() => mocks.exportOptions?.onDone({ success: true, data: {} }));
    expect(latestToast()?.message).toBe(i18n.t('common.exported'));
    act(() => mocks.importOptions?.onDone({ success: true }));
    expect(mocks.getSettings).toHaveBeenCalledTimes(1);
    expect(latestToast()?.message).toBe(i18n.t('common.imported'));
  });

  it.each([
    ['retrieve', () => mocks.retrieveOptions?.onDone, { success: false, message: 'common.error' }],
    ['update', () => mocks.updateOptions?.onDone, { success: false, message: 'literal failure' }],
    ['export', () => mocks.exportOptions?.onDone, { success: false, key: 'common.error' }],
    ['import', () => mocks.importOptions?.onDone, { success: false }]
  ] as const)('handles %s failure responses', (_name, getOnDone, response) => {
    render(<SettingsPage />, { wrapper });
    const onDone = getOnDone();
    act(() => onDone?.(response));

    if ('message' in response || 'key' in response) expect(latestToast()?.severity).toBe('error');
  });
});
