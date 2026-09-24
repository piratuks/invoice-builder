import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { ThemeContext } from '../../../../shared/components/layout/theme/ThemeProviderWrapper';
import { MenuItemSettings } from '../../../../shared/enums/menuItemSettings';
import { Themes } from '../../../../shared/enums/themes';
import type { MenuItem, MenuItemMetadata } from '../../../../shared/types/menuItem';
import type { Settings } from '../../../../shared/types/settings';
import { store } from '../../../../state/configureStore';
import { setSettings } from '../../../../state/pageSlice';
import { Menu } from '../Menu';

const mocks = vi.hoisted(() => ({
  isWebMode: vi.fn(() => true),
  openUrl: vi.fn(),
  checkForUpdates: vi.fn(),
  lists: [] as MenuItemMetadata[][]
}));

vi.mock('../../../../shared/api/restApi', () => ({
  getApi: () => ({ openUrl: mocks.openUrl, checkForUpdates: mocks.checkForUpdates }),
  isWebMode: mocks.isWebMode
}));

vi.mock('../../../../shared/components/lists/menuList/MenuList', () => ({
  MenuList: ({ items }: { items: MenuItemMetadata[] }) => {
    mocks.lists.push(items);
    return null;
  }
}));

const settings = {
  quotesON: true,
  invoiceSchedulesON: true,
  reportsON: false,
  styleProfilesON: true,
  presetsON: false,
  ublON: true,
  xrechnungON: false,
  receiptPrintingOn: true
} as Settings;

const renderMenu = (node: ReactNode, mode = Themes.light, toggleMode = vi.fn()) =>
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ThemeContext.Provider value={{ mode, toggleMode }}>{node}</ThemeContext.Provider>
      </I18nextProvider>
    </Provider>
  );

const allItems = () => mocks.lists.flatMap(groups => groups.flatMap(group => group.items));
const item = (key: string) => allItems().find(entry => entry.text === i18n.t(key)) as MenuItem;

describe('settings Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lists.length = 0;
    mocks.isWebMode.mockReturnValue(true);
    store.dispatch(setSettings(settings));
  });

  it('forwards selection, theme, feature, and backup callbacks', () => {
    const callbacks = {
      onSelected: vi.fn(),
      onModeChange: vi.fn(),
      toggleQuotes: vi.fn(),
      toggleInvoiceSchedules: vi.fn(),
      toggleReports: vi.fn(),
      toggleStyleProfiles: vi.fn(),
      togglePresets: vi.fn(),
      toggleUBL: vi.fn(),
      toggleXRechnung: vi.fn(),
      toggleReceiptPrinting: vi.fn(),
      onExportJSON: vi.fn(),
      onImportJSON: vi.fn()
    };
    const toggleMode = vi.fn();
    renderMenu(<Menu {...callbacks} selectedMenu={MenuItemSettings.LanguageFormat} />, Themes.light, toggleMode);

    item('settingsMenuItems.titles.languageFormat').onClick?.(item('settingsMenuItems.titles.languageFormat'));
    item('settingsMenuItems.titles.customizeInvoice').onClick?.(item('settingsMenuItems.titles.customizeInvoice'));
    item('settingsMenuItems.titles.darkMode').onChange?.(item('settingsMenuItems.titles.darkMode'));
    item('settingsMenuItems.titles.turnQuotes').onChange?.(item('settingsMenuItems.titles.turnQuotes'));
    item('settingsMenuItems.titles.turnInvoiceSchedules').onChange?.(
      item('settingsMenuItems.titles.turnInvoiceSchedules')
    );
    item('settingsMenuItems.titles.turnReports').onChange?.(item('settingsMenuItems.titles.turnReports'));
    item('settingsMenuItems.titles.turnStyleProfiles').onChange?.(item('settingsMenuItems.titles.turnStyleProfiles'));
    item('settingsMenuItems.titles.turnPresets').onChange?.(item('settingsMenuItems.titles.turnPresets'));
    item('settingsMenuItems.titles.turnUBL').onChange?.(item('settingsMenuItems.titles.turnUBL'));
    item('settingsMenuItems.titles.turnXRechnung').onChange?.(item('settingsMenuItems.titles.turnXRechnung'));
    item('settingsMenuItems.titles.turnReceiptPrinting').onChange?.(
      item('settingsMenuItems.titles.turnReceiptPrinting')
    );
    item('settingsMenuItems.titles.import').onClick?.(item('settingsMenuItems.titles.import'));
    item('settingsMenuItems.titles.export').onClick?.(item('settingsMenuItems.titles.export'));

    expect(callbacks.onSelected).toHaveBeenNthCalledWith(1, MenuItemSettings.LanguageFormat);
    expect(callbacks.onSelected).toHaveBeenNthCalledWith(2, MenuItemSettings.Receipt);
    expect(toggleMode).toHaveBeenCalledTimes(1);
    expect(callbacks.onModeChange).toHaveBeenCalledWith(true);
    expect(callbacks.toggleQuotes).toHaveBeenCalledWith(false);
    expect(callbacks.toggleInvoiceSchedules).toHaveBeenCalledWith(false);
    expect(callbacks.toggleReports).toHaveBeenCalledWith(true);
    expect(callbacks.toggleStyleProfiles).toHaveBeenCalledWith(false);
    expect(callbacks.togglePresets).toHaveBeenCalledWith(true);
    expect(callbacks.toggleUBL).toHaveBeenCalledWith(false);
    expect(callbacks.toggleXRechnung).toHaveBeenCalledWith(true);
    expect(callbacks.toggleReceiptPrinting).toHaveBeenCalledWith(false);
    expect(callbacks.onImportJSON).toHaveBeenCalledTimes(1);
    expect(callbacks.onExportJSON).toHaveBeenCalledTimes(1);
  });

  it('opens all external links and checks for desktop updates', () => {
    mocks.isWebMode.mockReturnValue(false);
    renderMenu(<Menu />, Themes.dark);

    for (const key of [
      'share',
      'tutorial',
      'support',
      'privacyPolicy',
      'about',
      'githubSponsors',
      'buyMeCoffee',
      'wallOfFame'
    ]) {
      const menuItem = item(`settingsMenuItems.titles.${key}`);
      menuItem.onClick?.(menuItem);
    }
    const updateItem = item('settingsMenuItems.titles.checkForUpdate');
    act(() => updateItem.onClick?.(updateItem));

    expect(mocks.openUrl).toHaveBeenCalledTimes(8);
    expect(mocks.checkForUpdates).toHaveBeenCalledTimes(1);
  });

  it('uses enabled fallbacks when settings are unavailable and omits web updates', () => {
    store.dispatch({ type: 'pageSlice/logout' });
    renderMenu(<Menu />);

    expect(item('settingsMenuItems.titles.turnQuotes').checked).toBe(true);
    expect(item('settingsMenuItems.titles.turnReports').checked).toBe(true);
    expect(allItems().some(entry => entry.text === i18n.t('settingsMenuItems.titles.checkForUpdate'))).toBe(false);
  });
});
