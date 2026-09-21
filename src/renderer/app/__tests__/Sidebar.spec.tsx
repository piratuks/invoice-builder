import { act, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '../../i18n';
import type { MenuItem, MenuItemMetadata } from '../../shared/types/menuItem';
import type { Settings } from '../../shared/types/settings';
import { store } from '../../state/configureStore';
import { setDbReady, setSettings } from '../../state/pageSlice';
import { Sidebar } from '../Sidebar';

const mocks = vi.hoisted(() => ({
  desktop: true,
  menuItems: [] as MenuItemMetadata[],
  confirmation: undefined as { isOpen: boolean; onCancel?: () => void; onConfirm?: () => void } | undefined,
  getAppVersion: vi.fn()
}));

vi.mock('@mui/material/useMediaQuery', () => ({ default: () => mocks.desktop }));
vi.mock('../../shared/api/restApi', () => ({ getApi: () => ({ getAppVersion: mocks.getAppVersion }) }));
vi.mock('../../shared/components/lists/menuList/MenuList', () => ({
  MenuList: ({ items, showText }: { items: MenuItemMetadata[]; showText: boolean }) => {
    mocks.menuItems = items;
    return <div data-testid="menu-state">{String(showText)}</div>;
  }
}));
vi.mock('../../shared/components/modals/confirmation', () => ({
  Confirmation: (props: typeof mocks.confirmation) => {
    mocks.confirmation = props;
    return null;
  }
}));

const Location = () => <div data-testid="location">{useLocation().pathname}</div>;
const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/invoices']}>
        {children}
        <Location />
      </MemoryRouter>
    </I18nextProvider>
  </Provider>
);
const items = () => mocks.menuItems.flatMap(group => group.items);
const findItem = (text: string) => items().find(item => item.text === text) as MenuItem;

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.desktop = true;
    mocks.getAppVersion.mockResolvedValue('9.9.9');
    store.dispatch(setDbReady(true));
    store.dispatch(
      setSettings({ quotesON: true, presetsON: true, styleProfilesON: true, reportsON: true } as Settings)
    );
  });

  it('builds enabled navigation, navigates, selects the current path, and collapses', async () => {
    render(<Sidebar />, { wrapper });
    await waitFor(() => expect(mocks.getAppVersion).toHaveBeenCalledTimes(1));

    const invoices = findItem(i18n.t('menuItems.invoices'));
    expect(typeof invoices.isSelected).toBe('function');
    expect((invoices.isSelected as (item: MenuItem) => boolean)(invoices)).toBe(true);
    expect(findItem(i18n.t('menuItems.quotes'))).toBeDefined();
    expect(findItem(i18n.t('menuItems.presets'))).toBeDefined();
    expect(findItem(i18n.t('menuItems.styleProfiles'))).toBeDefined();
    expect(findItem(i18n.t('menuItems.reports'))).toBeDefined();

    const settings = findItem(i18n.t('menuItems.settings'));
    act(() => settings.onClick?.(settings));
    expect(screen.getByTestId('location')).toHaveTextContent('/settings');

    act(() => screen.getByRole('button', { name: i18n.t('ariaLabel.menu') }).click());
    expect(screen.getByTestId('menu-state')).toHaveTextContent('false');
  });

  it('opens, cancels, and confirms logout', () => {
    render(<Sidebar />, { wrapper });
    const logoutItem = findItem(i18n.t('menuItems.logout'));

    act(() => logoutItem.onClick?.(logoutItem));
    expect(mocks.confirmation?.isOpen).toBe(true);
    act(() => mocks.confirmation?.onCancel?.());
    expect(mocks.confirmation?.isOpen).toBe(false);
    act(() => logoutItem.onClick?.(logoutItem));
    act(() => mocks.confirmation?.onConfirm?.());

    expect(store.getState().pageSlice.dbReady).toBe(false);
  });

  it('omits disabled features and starts collapsed on mobile', () => {
    mocks.desktop = false;
    store.dispatch(
      setSettings({ quotesON: false, presetsON: false, styleProfilesON: false, reportsON: false } as Settings)
    );
    render(<Sidebar />, { wrapper });

    expect(screen.getByTestId('menu-state')).toHaveTextContent('false');
    expect(items().some(item => item.text === i18n.t('menuItems.quotes'))).toBe(false);
    expect(items().some(item => item.text === i18n.t('menuItems.reports'))).toBe(false);
    expect(screen.queryByRole('button', { name: i18n.t('ariaLabel.menu') })).not.toBeInTheDocument();
  });
});
