import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { categoriesApi, useGetCategoriesQuery } from '../../../api/categoriesApi';
import { getApi } from '../../../api/restApi';
import { useItemAdd } from '../useItemAdd';
import { useItemAddBatch } from '../useItemAddBatch';
import { useItemDelete } from '../useItemDelete';
import { useItemsRetrieve } from '../useItemsRetrieve';
import { useItemUpdate } from '../useItemUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('item hooks', () => {
  const mockApi = {
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    getAllItems: vi.fn(),
    addBatchItem: vi.fn(),
    getAllUnits: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getAllCategories: vi.fn().mockResolvedValue({ success: true, data: [] })
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(categoriesApi.util.resetApiState());
    mockApi.getAllUnits.mockResolvedValue({ success: true, data: [] });
    mockApi.getAllCategories.mockResolvedValue({ success: true, data: [] });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useItemAdd', () => {
    it('adds an item and unwraps the response data', async () => {
      mockApi.addItem.mockResolvedValue({ success: true, data: { id: 1, name: 'Item A' } });
      const { result } = renderHook(() => useItemAdd({ item: { name: 'Item A' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addItem).toHaveBeenCalledWith({ name: 'Item A' });
      expect(result.current.data).toEqual({ id: 1, name: 'Item A' });
    });

    it('resolves to undefined data when no item is provided', async () => {
      const { result } = renderHook(() => useItemAdd({ item: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addItem).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useItemUpdate', () => {
    it('updates an item and returns the full response', async () => {
      mockApi.updateItem.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(() => useItemUpdate({ item: { id: 1, name: 'Updated' } as never }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateItem).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no item is provided', async () => {
      const { result } = renderHook(() => useItemUpdate({ item: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateItem).not.toHaveBeenCalled();
    });
  });

  describe('useItemDelete', () => {
    it('deletes an item by id', async () => {
      mockApi.deleteItem.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useItemDelete({ id: 8 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteItem).toHaveBeenCalledWith(8);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useItemsRetrieve', () => {
    it('retrieves items and defaults to an empty array', async () => {
      mockApi.getAllItems.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Item A' }] });
      const { result } = renderHook(() => useItemsRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.items).toHaveLength(1));
      expect(mockApi.getAllItems).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllItems.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useItemsRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllItems).toHaveBeenCalled());
      expect(result.current.items).toEqual([]);
    });
  });

  describe('useItemAddBatch', () => {
    it('batch adds items, reloads units, and invalidates the categories cache so active subscribers refetch', async () => {
      mockApi.addBatchItem.mockResolvedValue({ success: true });
      const items = [{ name: 'Item A' } as never];

      const { result: categoriesResult } = renderHook(() => useGetCategoriesQuery(undefined), { wrapper });
      await waitFor(() => expect(categoriesResult.current.isSuccess).toBe(true));
      expect(mockApi.getAllCategories).toHaveBeenCalledTimes(1);

      const { result } = renderHook(() => useItemAddBatch({ items }), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchItem).toHaveBeenCalledWith(items);
      expect(result.current.data).toEqual({ success: true });
      await waitFor(() => expect(mockApi.getAllUnits).toHaveBeenCalled());
      await waitFor(() => expect(mockApi.getAllCategories).toHaveBeenCalledTimes(2));
    });

    it('resolves to a failure result when no items are provided', async () => {
      const { result } = renderHook(() => useItemAddBatch({ items: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchItem).not.toHaveBeenCalled();
    });

    it('surfaces a toast when reloading units fails after a batch add', async () => {
      mockApi.addBatchItem.mockResolvedValue({ success: true });
      mockApi.getAllUnits.mockResolvedValue({ success: false, key: 'error.unknownError' });
      const items = [{ name: 'Item A' } as never];
      renderHook(() => useItemAddBatch({ items }), { wrapper });

      await waitFor(() => {
        const toasts = store.getState().pageSlice.toasts;
        expect(toasts.some(toast => toast.message === i18n.t('error.unknownError'))).toBe(true);
      });
    });
  });
});
