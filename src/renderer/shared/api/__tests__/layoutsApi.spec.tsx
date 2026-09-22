import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import {
  layoutsApi,
  useAddLayoutMutation,
  useDeleteLayoutMutation,
  useExportLayoutMutation,
  useGetLayoutsQuery,
  useUpdateLayoutMutation
} from '../layoutsApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('layoutsApi', () => {
  const mockApi = {
    getAllLayouts: vi.fn(),
    addLayout: vi.fn(),
    updateLayout: vi.fn(),
    deleteLayout: vi.fn(),
    exportLayout: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(layoutsApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetLayoutsQuery', () => {
    it('returns the layout list on success', async () => {
      mockApi.getAllLayouts.mockResolvedValue({
        success: true,
        data: [{ id: 1, schema: {} }]
      });

      const { result } = renderHook(() => useGetLayoutsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllLayouts).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, schema: {} }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllLayouts.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetLayoutsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllLayouts.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetLayoutsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a layout and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllLayouts.mockResolvedValue({ success: true, data: [] });
      mockApi.addLayout.mockResolvedValue({ success: true, data: { id: 2, schema: {} } });

      const { result: queryResult } = renderHook(() => useGetLayoutsQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddLayoutMutation(), { wrapper });
      const [addLayout] = mutationResult.current;

      mockApi.getAllLayouts.mockResolvedValue({ success: true, data: [{ id: 2, schema: {} }] });
      await addLayout({ schema: {} } as never);

      expect(mockApi.addLayout).toHaveBeenCalledWith({ schema: {} });
      await waitFor(() => expect(mockApi.getAllLayouts).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, schema: {} }]));
    });

    it('updates a layout', async () => {
      mockApi.updateLayout.mockResolvedValue({ success: true, data: { id: 1, schema: { a: 1 } } });

      const { result } = renderHook(() => useUpdateLayoutMutation(), { wrapper });
      const [updateLayout] = result.current;

      const response = await updateLayout({ id: 1, schema: { a: 1 } } as never);

      expect(mockApi.updateLayout).toHaveBeenCalledWith({ id: 1, schema: { a: 1 } });
      expect(response).toEqual({ data: { id: 1, schema: { a: 1 } } });
    });

    it('deletes a layout and surfaces API errors', async () => {
      mockApi.deleteLayout.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteLayoutMutation(), { wrapper });
      const [deleteLayout] = result.current;

      const response = await deleteLayout(1);

      expect(mockApi.deleteLayout).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });

    it('exports a layout by id', async () => {
      mockApi.exportLayout.mockResolvedValue({ success: true, data: { filePath: 'layout.json' } });

      const { result } = renderHook(() => useExportLayoutMutation(), { wrapper });
      const [exportLayout] = result.current;

      const response = await exportLayout(1);

      expect(mockApi.exportLayout).toHaveBeenCalledWith(1);
      expect(response).toEqual({ data: { filePath: 'layout.json' } });
    });
  });
});
