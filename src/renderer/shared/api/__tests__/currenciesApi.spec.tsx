import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import {
  currenciesApi,
  useAddCurrenciesBatchMutation,
  useAddCurrencyMutation,
  useDeleteCurrencyMutation,
  useGetCurrenciesQuery,
  useUpdateCurrencyMutation
} from '../currenciesApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('currenciesApi', () => {
  const mockApi = {
    getAllCurrencies: vi.fn(),
    addCurrency: vi.fn(),
    addBatchCurrency: vi.fn(),
    updateCurrency: vi.fn(),
    deleteCurrency: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(currenciesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetCurrenciesQuery', () => {
    it('returns the currency list on success', async () => {
      mockApi.getAllCurrencies.mockResolvedValue({
        success: true,
        data: [{ id: 1, code: 'USD' }]
      });

      const { result } = renderHook(() => useGetCurrenciesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllCurrencies).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, code: 'USD' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllCurrencies.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetCurrenciesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllCurrencies.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetCurrenciesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a currency and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllCurrencies.mockResolvedValue({ success: true, data: [] });
      mockApi.addCurrency.mockResolvedValue({ success: true, data: { id: 2, code: 'EUR' } });

      const { result: queryResult } = renderHook(() => useGetCurrenciesQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddCurrencyMutation(), { wrapper });
      const [addCurrency] = mutationResult.current;

      mockApi.getAllCurrencies.mockResolvedValue({ success: true, data: [{ id: 2, code: 'EUR' }] });
      await addCurrency({ code: 'EUR' } as never);

      expect(mockApi.addCurrency).toHaveBeenCalledWith({ code: 'EUR' });
      await waitFor(() => expect(mockApi.getAllCurrencies).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, code: 'EUR' }]));
    });

    it('adds a batch of currencies', async () => {
      mockApi.addBatchCurrency.mockResolvedValue({ success: true, data: [{ id: 3, code: 'GBP' }] });

      const { result } = renderHook(() => useAddCurrenciesBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await addBatch([{ code: 'GBP' } as never]);

      expect(mockApi.addBatchCurrency).toHaveBeenCalledWith([{ code: 'GBP' }]);
      expect(response).toEqual({ data: [{ id: 3, code: 'GBP' }] });
    });

    it('updates a currency', async () => {
      mockApi.updateCurrency.mockResolvedValue({ success: true, data: { id: 1, code: 'USD' } });

      const { result } = renderHook(() => useUpdateCurrencyMutation(), { wrapper });
      const [updateCurrency] = result.current;

      const response = await updateCurrency({ id: 1, code: 'USD' } as never);

      expect(mockApi.updateCurrency).toHaveBeenCalledWith({ id: 1, code: 'USD' });
      expect(response).toEqual({ data: { id: 1, code: 'USD' } });
    });

    it('deletes a currency and surfaces API errors', async () => {
      mockApi.deleteCurrency.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteCurrencyMutation(), { wrapper });
      const [deleteCurrency] = result.current;

      const response = await deleteCurrency(1);

      expect(mockApi.deleteCurrency).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
