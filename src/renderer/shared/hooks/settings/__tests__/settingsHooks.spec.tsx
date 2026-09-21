import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';
import { getApi } from '../../../api/restApi';
import { useSettingsRetrieve } from '../useSettingsRetrieve';
import { useSettingsUpdate } from '../useSettingsUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('settings hooks', () => {
  const mockApi = {
    getAllSettings: vi.fn(),
    updateSettings: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useSettingsRetrieve', () => {
    it('retrieves settings and syncs the store', async () => {
      mockApi.getAllSettings.mockResolvedValue({ success: true, data: { id: 1, language: 'en' } });
      const { result } = renderHook(() => useSettingsRetrieve({}), { wrapper });

      await waitFor(() => expect(result.current.settings).toEqual({ id: 1, language: 'en' }));
      expect(mockApi.getAllSettings).toHaveBeenCalled();
      await waitFor(() => expect(selectSettings(store.getState())).toEqual({ id: 1, language: 'en' }));
    });

    it('does not dispatch settings when the response has no data', async () => {
      mockApi.getAllSettings.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useSettingsRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllSettings).toHaveBeenCalled());
      expect(result.current.settings).toBeUndefined();
    });
  });

  describe('useSettingsUpdate', () => {
    it('updates settings with the given payload', async () => {
      mockApi.updateSettings.mockResolvedValue({ success: true, data: { language: 'fr' } });
      const { result } = renderHook(() => useSettingsUpdate({ newSettings: { language: 'fr' } as never }), {
        wrapper
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateSettings).toHaveBeenCalledWith({ language: 'fr' });
      expect(result.current.data).toEqual({ success: true, data: { language: 'fr' } });
    });
  });
});
