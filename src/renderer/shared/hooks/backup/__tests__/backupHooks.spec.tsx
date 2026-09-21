import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { useExportJson } from '../useExportJson';
import { useImportJson } from '../useImportJson';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('backup hooks', () => {
  const mockApi = {
    exportAllData: vi.fn(),
    importAllData: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useExportJson', () => {
    it('exports all data', async () => {
      mockApi.exportAllData.mockResolvedValue({ success: true, data: { filePath: 'backup.json' } });
      const { result } = renderHook(() => useExportJson({}), { wrapper });
      await waitFor(() => expect(result.current.data?.data?.filePath).toBe('backup.json'));
      expect(mockApi.exportAllData).toHaveBeenCalled();
    });
  });

  describe('useImportJson', () => {
    it('imports data from a chosen file', async () => {
      mockApi.importAllData.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useImportJson({}), { wrapper });
      await waitFor(() => expect(result.current.data).toEqual({ success: true }));
      expect(mockApi.importAllData).toHaveBeenCalled();
    });
  });
});
