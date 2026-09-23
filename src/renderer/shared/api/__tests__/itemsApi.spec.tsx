import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { categoriesApi, useGetCategoriesQuery } from '../categoriesApi';
import { itemsApi, useAddItemMutation, useAddItemsBatchMutation, useGetItemsQuery } from '../itemsApi';
import { getApi } from '../restApi';
import { unitsApi, useGetUnitsQuery } from '../unitsApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('itemsApi', () => {
  const mockApi = {
    getAllItems: vi.fn(),
    addItem: vi.fn(),
    addBatchItem: vi.fn(),
    getAllCategories: vi.fn(),
    getAllUnits: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(itemsApi.util.resetApiState());
    store.dispatch(categoriesApi.util.resetApiState());
    store.dispatch(unitsApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('retrieves items with filters and normalizes API errors', async () => {
    const filter = [{ type: 'active', value: true }] as never;
    mockApi.getAllItems.mockResolvedValueOnce({ success: true, data: [{ id: 1, name: 'Paper' }] });
    const query = renderHook(() => useGetItemsQuery(filter), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));
    expect(mockApi.getAllItems).toHaveBeenCalledWith(filter);

    store.dispatch(itemsApi.util.resetApiState());
    mockApi.getAllItems.mockResolvedValue({ success: false, message: 'failed' });
    const failed = renderHook(() => useGetItemsQuery(undefined), { wrapper });
    await waitFor(() => expect(failed.result.current.isError).toBe(true));
    expect(failed.result.current.error).toEqual({ kind: 'response', message: 'failed', key: undefined });
  });

  it('invalidates item queries after adding an item', async () => {
    mockApi.getAllItems.mockResolvedValueOnce({ success: true, data: [] });
    const query = renderHook(() => useGetItemsQuery(undefined), { wrapper });
    await waitFor(() => expect(query.result.current.isSuccess).toBe(true));
    mockApi.addItem.mockResolvedValue({ success: true, data: { id: 2, name: 'Pen' } });
    mockApi.getAllItems.mockResolvedValueOnce({ success: true, data: [{ id: 2, name: 'Pen' }] });

    const mutation = renderHook(() => useAddItemMutation(), { wrapper });
    await mutation.result.current[0]({ name: 'Pen' } as never);
    await waitFor(() => expect(mockApi.getAllItems).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(query.result.current.data).toEqual([{ id: 2, name: 'Pen' }]));
  });

  it('refreshes category and unit caches after a successful batch import', async () => {
    mockApi.getAllCategories.mockResolvedValue({ success: true, data: [] });
    mockApi.getAllUnits.mockResolvedValue({ success: true, data: [] });
    renderHook(() => useGetCategoriesQuery(undefined), { wrapper });
    renderHook(() => useGetUnitsQuery(undefined), { wrapper });
    await waitFor(() => expect(mockApi.getAllCategories).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockApi.getAllUnits).toHaveBeenCalledTimes(1));

    mockApi.addBatchItem.mockResolvedValue({ success: true, data: [] });
    const mutation = renderHook(() => useAddItemsBatchMutation(), { wrapper });
    await mutation.result.current[0]([{ name: 'New', isArchived: false } as never]);

    await waitFor(() => expect(mockApi.getAllCategories).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockApi.getAllUnits).toHaveBeenCalledTimes(2));
  });
});
