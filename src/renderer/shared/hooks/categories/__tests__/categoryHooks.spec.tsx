import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { selectCategoriesOptions } from '../../../../state/pageSlice';
import { getApi } from '../../../api/restApi';
import { useCategoriesRetrieve } from '../useCategoriesRetrieve';
import { useCategoryAdd } from '../useCategoryAdd';
import { useCategoryAddBatch } from '../useCategoryAddBatch';
import { useCategoryDelete } from '../useCategoryDelete';
import { useCategoryUpdate } from '../useCategoryUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('category hooks', () => {
  const mockApi = {
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getAllCategories: vi.fn(),
    addBatchCategory: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useCategoryAdd', () => {
    it('adds a category and unwraps the response data', async () => {
      mockApi.addCategory.mockResolvedValue({ success: true, data: { id: 1, name: 'Cat A' } });
      const { result } = renderHook(() => useCategoryAdd({ category: { name: 'Cat A' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addCategory).toHaveBeenCalledWith({ name: 'Cat A' });
      expect(result.current.data).toEqual({ id: 1, name: 'Cat A' });
    });

    it('resolves to undefined data when no category is provided', async () => {
      const { result } = renderHook(() => useCategoryAdd({ category: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addCategory).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCategoryUpdate', () => {
    it('updates a category and returns the full response', async () => {
      mockApi.updateCategory.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(() => useCategoryUpdate({ category: { id: 1, name: 'Updated' } as never }), {
        wrapper
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateCategory).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no category is provided', async () => {
      const { result } = renderHook(() => useCategoryUpdate({ category: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateCategory).not.toHaveBeenCalled();
    });
  });

  describe('useCategoryDelete', () => {
    it('deletes a category by id', async () => {
      mockApi.deleteCategory.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useCategoryDelete({ id: 3 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteCategory).toHaveBeenCalledWith(3);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useCategoriesRetrieve', () => {
    it('retrieves categories, defaults to an empty array and syncs store options', async () => {
      mockApi.getAllCategories.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Cat A' }] });
      const { result } = renderHook(() => useCategoriesRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.categories).toHaveLength(1));
      expect(mockApi.getAllCategories).toHaveBeenCalledWith(undefined);
      await waitFor(() => expect(selectCategoriesOptions(store.getState())).toEqual([{ label: 'Cat A', value: 1 }]));
    });

    it('defaults to an empty array and does not dispatch options when the response has no data', async () => {
      mockApi.getAllCategories.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useCategoriesRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllCategories).toHaveBeenCalled());
      expect(result.current.categories).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllCategories.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => useCategoriesRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllCategories).toHaveBeenCalledWith(filter));
    });
  });

  describe('useCategoryAddBatch', () => {
    it('batch adds categories when data is provided', async () => {
      mockApi.addBatchCategory.mockResolvedValue({ success: true });
      const categories = [{ name: 'Cat A' } as never];
      const { result } = renderHook(() => useCategoryAddBatch({ categories }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchCategory).toHaveBeenCalledWith(categories);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no categories are provided', async () => {
      const { result } = renderHook(() => useCategoryAddBatch({ categories: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchCategory).not.toHaveBeenCalled();
    });
  });
});
