import { describe, beforeEach, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../i18n';
import { store } from '../../state/configureStore';
import { setNewVersion, setUpdateMessage, setVersion } from '../../state/pageSlice';
import { Updater } from '../Updater';

const updaterMocks = vi.hoisted(() => ({
  onUpdateDownloaded: undefined as ((version: string) => void) | undefined
}));

vi.mock('../../shared/api/restApi', () => ({
  getApi: () => ({
    onUpdateAvailable: () => () => {},
    onUpdateNotAvailable: () => () => {},
    onUpdateProgress: () => () => {},
    onUpdateDownloaded: (callback: (version: string) => void) => {
      updaterMocks.onUpdateDownloaded = callback;
      return () => {};
    },
    restartApp: vi.fn()
  })
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('Updater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updaterMocks.onUpdateDownloaded = undefined;
    store.dispatch(setVersion('2.10.0'));
    store.dispatch(setNewVersion(undefined));
    store.dispatch(setUpdateMessage(undefined));
  });

  it('shows the database upgrade warning for version 3.0.2', async () => {
    render(<Updater />, { wrapper });

    act(() => updaterMocks.onUpdateDownloaded?.('3.0.2'));

    expect(await screen.findByText(i18n.t('settingsMenuItems.updateDatabaseWarning'))).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('settingsMenuItems.updateConfirmText', { currentVersion: '2.10.0', newVersion: '3.0.2' }))
    ).toBeInTheDocument();
  });

  it.skip('does not show the database upgrade warning for later releases', async () => {
    render(<Updater />, { wrapper });

    act(() => updaterMocks.onUpdateDownloaded?.('3.0.3'));

    expect(
      await screen.findByText(
        i18n.t('settingsMenuItems.updateConfirmText', { currentVersion: '2.10.0', newVersion: '3.0.3' })
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('settingsMenuItems.updateDatabaseWarning'))).not.toBeInTheDocument();
  });
});
