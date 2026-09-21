import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { useLayoutAdd } from '../useLayoutAdd';
import { useLayoutDelete } from '../useLayoutDelete';
import { useExportLayout } from '../useLayoutExport';
import { useLayoutsRetrieve } from '../useLayoutsRetrieve';
import { useLayoutUpdate } from '../useLayoutUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('layout hooks', () => {
  const mockApi = {
    addLayout: vi.fn(),
    updateLayout: vi.fn(),
    deleteLayout: vi.fn(),
    getAllLayouts: vi.fn(),
    exportLayout: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useLayoutAdd', () => {
    it('adds a layout and unwraps the response data', async () => {
      mockApi.addLayout.mockResolvedValue({ success: true, data: { id: 1, schema: {} } });
      const { result } = renderHook(() => useLayoutAdd({ layout: { schema: {} } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addLayout).toHaveBeenCalledWith({ schema: {} });
      expect(result.current.data).toEqual({ id: 1, schema: {} });
    });

    it('resolves to undefined data when no layout is provided', async () => {
      const { result } = renderHook(() => useLayoutAdd({ layout: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addLayout).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useLayoutUpdate', () => {
    it('updates a layout and returns the full response', async () => {
      mockApi.updateLayout.mockResolvedValue({ success: true, data: { id: 1, schema: { a: 1 } } });
      const { result } = renderHook(() => useLayoutUpdate({ layout: { id: 1, schema: { a: 1 } } as never }), {
        wrapper
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateLayout).toHaveBeenCalledWith({ id: 1, schema: { a: 1 } });
      expect(result.current.data?.data?.schema).toEqual({ a: 1 });
    });

    it('resolves to a failure result when no layout is provided', async () => {
      const { result } = renderHook(() => useLayoutUpdate({ layout: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateLayout).not.toHaveBeenCalled();
    });
  });

  describe('useLayoutDelete', () => {
    it('deletes a layout by id', async () => {
      mockApi.deleteLayout.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useLayoutDelete({ id: 5 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteLayout).toHaveBeenCalledWith(5);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useLayoutsRetrieve', () => {
    it('retrieves layouts and defaults to an empty array', async () => {
      mockApi.getAllLayouts.mockResolvedValue({ success: true, data: [{ id: 1, schema: {} }] });
      const { result } = renderHook(() => useLayoutsRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.layouts).toHaveLength(1));
      expect(mockApi.getAllLayouts).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllLayouts.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useLayoutsRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllLayouts).toHaveBeenCalled());
      expect(result.current.layouts).toEqual([]);
    });
  });

  describe('useExportLayout', () => {
    it('exports a layout by id', async () => {
      mockApi.exportLayout.mockResolvedValue({ success: true, data: { filePath: 'layout.json' } });
      const { result } = renderHook(() => useExportLayout({ id: 1 }), { wrapper });
      await waitFor(() => expect(mockApi.exportLayout).toHaveBeenCalledWith(1));
      await waitFor(() => expect(result.current.data?.data?.filePath).toBe('layout.json'));
    });

    it('resolves to a failure result when no id is provided', async () => {
      const { result } = renderHook(() => useExportLayout({ id: undefined }), { wrapper });
      await waitFor(() => expect(result.current.data).toEqual({ success: false }));
      expect(mockApi.exportLayout).not.toHaveBeenCalled();
    });
  });
});
