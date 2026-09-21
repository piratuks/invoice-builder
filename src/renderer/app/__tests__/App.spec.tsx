import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../i18n';
import type { Response } from '../../shared/types/response';
import type { Settings } from '../../shared/types/settings';
import { store } from '../../state/configureStore';
import { addToast, setAllowed } from '../../state/pageSlice';
import { App } from '../App';

const mocks = vi.hoisted(() => ({
  settings: undefined as Settings | undefined,
  settingsOptions: undefined as { onDone: (data: Response<Settings>) => void } | undefined,
  getSettings: vi.fn(),
  attemptNavigation: vi.fn(),
  setBlocked: vi.fn(),
  cancelNavigation: vi.fn(),
  confirmNavigation: vi.fn(),
  showPrompt: false,
  databaseRead: undefined as (() => void) | undefined,
  closeToast: undefined as ((id: string) => void) | undefined,
  confirmation: undefined as { onCancel: () => void; onConfirm: () => void } | undefined
}));

vi.mock('../../shared/hooks/settings/useSettingsRetrieve', () => ({
  useSettingsRetrieve: (options: { onDone: (data: Response<Settings>) => void }) => {
    mocks.settingsOptions = options;
    return { settings: mocks.settings, execute: mocks.getSettings };
  }
}));
vi.mock('../../shared/hooks/other/useBeforeLeave', () => ({
  useBeforeLeave: () => ({
    showPrompt: mocks.showPrompt,
    cancelNavigation: mocks.cancelNavigation,
    confirmNavigation: mocks.confirmNavigation,
    attemptNavigation: mocks.attemptNavigation,
    setBlocked: mocks.setBlocked
  })
}));
vi.mock('../AppLayout', () => ({ AppLayout: () => <div>app-layout</div> }));
vi.mock('../DatabaseChooser/DatabaseChooser', () => ({
  DatabaseChooser: ({ onDatabaseRead }: { onDatabaseRead: () => void }) => {
    mocks.databaseRead = onDatabaseRead;
    return <div>database-chooser</div>;
  }
}));
vi.mock('../../shared/components/feedback/spinner/SpinnerOverlay', () => ({
  SpinnerOverlay: () => <div>spinner</div>
}));
vi.mock('../../shared/components/feedback/toast/toastContainer', () => ({
  ToastContainer: ({ onClose }: { onClose: (id: string) => void }) => {
    mocks.closeToast = onClose;
    return null;
  }
}));
vi.mock('../../shared/components/modals/confirmation', () => ({
  Confirmation: (props: { onCancel: () => void; onConfirm: () => void }) => {
    mocks.confirmation = props;
    return null;
  }
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.settings = undefined;
    mocks.showPrompt = false;
    store.dispatch({ type: 'pageSlice/logout' });
    for (const toast of store.getState().pageSlice.toasts)
      store.dispatch({ type: 'pageSlice/removeToast', payload: toast.id });
  });

  it('reads the selected database and switches to the app layout', () => {
    render(<App />, { wrapper });
    expect(screen.getByText('database-chooser')).toBeInTheDocument();

    act(() => mocks.databaseRead?.());
    expect(mocks.getSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByText('app-layout')).toBeInTheDocument();
  });

  it.each([
    [{ success: false, message: 'common.error' }, i18n.t('common.error')],
    [{ success: false, message: 'server detail' }, 'server detail'],
    [{ success: false, key: 'common.error' }, i18n.t('common.error')]
  ] as const)('reports settings retrieval failures', (response, expected) => {
    render(<App />, { wrapper });
    act(() => mocks.settingsOptions?.onDone(response as Response<Settings>));
    expect(store.getState().pageSlice.toasts.at(-1)?.message).toBe(expected);
  });

  it('stores retrieved settings, language, and navigation handlers', () => {
    mocks.settings = { language: 'de' } as Settings;
    mocks.showPrompt = true;
    store.dispatch(setAllowed(false));
    render(<App />, { wrapper });

    expect(store.getState().pageSlice.settings).toEqual(mocks.settings);
    expect(localStorage.getItem('lastUsedLanguage')).toBe('de');
    act(() => mocks.confirmation?.onConfirm());
    act(() => mocks.confirmation?.onCancel());
    expect(mocks.confirmNavigation).toHaveBeenCalledTimes(1);
    expect(mocks.cancelNavigation).toHaveBeenCalledTimes(1);
  });

  it('removes a toast through the container callback', () => {
    store.dispatch(addToast({ message: 'temporary', severity: 'info' }));
    const id = store.getState().pageSlice.toasts.at(-1)?.id as string;
    render(<App />, { wrapper });

    act(() => mocks.closeToast?.(id));
    expect(store.getState().pageSlice.toasts.some(toast => toast.id === id)).toBe(false);
  });
});
