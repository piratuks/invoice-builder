import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { getApi } from '../restApi';
import { settingsApi, useGetSettingsQuery, useUpdateSettingsMutation } from '../settingsApi';
import { runApiTrigger } from './testUtils';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('settingsApi', () => {
  const mockApi = {
    getAllSettings: vi.fn(),
    updateSettings: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(settingsApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetSettingsQuery', () => {
    it('returns the settings on success', async () => {
      mockApi.getAllSettings.mockResolvedValue({ success: true, data: { id: 1, language: 'en' } });

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllSettings).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual({ id: 1, language: 'en' });
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllSettings.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllSettings.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetSettingsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('useUpdateSettingsMutation', () => {
    it('updates settings without invalidating the singleton tag', async () => {
      mockApi.getAllSettings.mockResolvedValue({ success: true, data: { id: 1, language: 'en' } });
      mockApi.updateSettings.mockResolvedValue({ success: true, data: { id: 1, language: 'fr' } });

      const { result: queryResult } = renderHook(() => useGetSettingsQuery(), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useUpdateSettingsMutation(), { wrapper });
      const [updateSettings] = mutationResult.current;

      const response = await runApiTrigger(() => updateSettings({ language: 'fr' } as never));

      expect(mockApi.updateSettings).toHaveBeenCalledWith({ language: 'fr' });
      expect(response).toEqual({ data: { id: 1, language: 'fr' } });
      expect(mockApi.getAllSettings).toHaveBeenCalledTimes(1);
    });

    it('surfaces API errors', async () => {
      mockApi.updateSettings.mockResolvedValue({ success: false, key: 'error.updateFailed' });

      const { result } = renderHook(() => useUpdateSettingsMutation(), { wrapper });
      const [updateSettings] = result.current;

      const response = await runApiTrigger(() => updateSettings({ language: 'fr' } as never));

      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.updateFailed' } });
    });
  });
});
