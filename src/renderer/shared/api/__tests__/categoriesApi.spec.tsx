import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import {
  categoriesApi,
  useAddCategoriesBatchMutation,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation
} from '../categoriesApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('categoriesApi', () => {
  const mockApi = {
    getAllCategories: vi.fn(),
    addCategory: vi.fn(),
    addBatchCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(categoriesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetCategoriesQuery', () => {
    it('returns the category list on success', async () => {
      mockApi.getAllCategories.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Goods' }]
      });

      const { result } = renderHook(() => useGetCategoriesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllCategories).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, name: 'Goods' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllCategories.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetCategoriesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllCategories.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetCategoriesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a category and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllCategories.mockResolvedValue({ success: true, data: [] });
      mockApi.addCategory.mockResolvedValue({ success: true, data: { id: 2, name: 'Services' } });

      const { result: queryResult } = renderHook(() => useGetCategoriesQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddCategoryMutation(), { wrapper });
      const [addCategory] = mutationResult.current;

      mockApi.getAllCategories.mockResolvedValue({ success: true, data: [{ id: 2, name: 'Services' }] });
      await addCategory({ name: 'Services' } as never);

      expect(mockApi.addCategory).toHaveBeenCalledWith({ name: 'Services' });
      await waitFor(() => expect(mockApi.getAllCategories).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, name: 'Services' }]));
    });

    it('adds a batch of categories', async () => {
      mockApi.addBatchCategory.mockResolvedValue({ success: true, data: [{ id: 3, name: 'Batch Category' }] });

      const { result } = renderHook(() => useAddCategoriesBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await addBatch([{ name: 'Batch Category' } as never]);

      expect(mockApi.addBatchCategory).toHaveBeenCalledWith([{ name: 'Batch Category' }]);
      expect(response).toEqual({ data: [{ id: 3, name: 'Batch Category' }] });
    });

    it('updates a category', async () => {
      mockApi.updateCategory.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });

      const { result } = renderHook(() => useUpdateCategoryMutation(), { wrapper });
      const [updateCategory] = result.current;

      const response = await updateCategory({ id: 1, name: 'Updated' } as never);

      expect(mockApi.updateCategory).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(response).toEqual({ data: { id: 1, name: 'Updated' } });
    });

    it('deletes a category and surfaces API errors', async () => {
      mockApi.deleteCategory.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteCategoryMutation(), { wrapper });
      const [deleteCategory] = result.current;

      const response = await deleteCategory(1);

      expect(mockApi.deleteCategory).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
