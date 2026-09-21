import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { useCurrenciesRetrieve } from '../useCurrenciesRetrieve';
import { useCurrencyAdd } from '../useCurrencyAdd';
import { useCurrencyAddBatch } from '../useCurrencyAddBatch';
import { useCurrencyDelete } from '../useCurrencyDelete';
import { useCurrencyUpdate } from '../useCurrencyUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('currency hooks', () => {
  const mockApi = {
    addCurrency: vi.fn(),
    updateCurrency: vi.fn(),
    deleteCurrency: vi.fn(),
    getAllCurrencies: vi.fn(),
    addBatchCurrency: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useCurrencyAdd', () => {
    it('adds a currency and unwraps the response data', async () => {
      mockApi.addCurrency.mockResolvedValue({ success: true, data: { id: 1, code: 'USD' } });
      const { result } = renderHook(() => useCurrencyAdd({ currency: { code: 'USD' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addCurrency).toHaveBeenCalledWith({ code: 'USD' });
      expect(result.current.data).toEqual({ id: 1, code: 'USD' });
    });

    it('resolves to undefined data when no currency is provided', async () => {
      const { result } = renderHook(() => useCurrencyAdd({ currency: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addCurrency).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCurrencyUpdate', () => {
    it('updates a currency and returns the full response', async () => {
      mockApi.updateCurrency.mockResolvedValue({ success: true, data: { id: 1, code: 'EUR' } });
      const { result } = renderHook(() => useCurrencyUpdate({ currency: { id: 1, code: 'EUR' } as never }), {
        wrapper
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateCurrency).toHaveBeenCalledWith({ id: 1, code: 'EUR' });
      expect(result.current.data?.data?.code).toBe('EUR');
    });

    it('resolves to a failure result when no currency is provided', async () => {
      const { result } = renderHook(() => useCurrencyUpdate({ currency: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateCurrency).not.toHaveBeenCalled();
    });
  });

  describe('useCurrencyDelete', () => {
    it('deletes a currency by id', async () => {
      mockApi.deleteCurrency.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useCurrencyDelete({ id: 4 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteCurrency).toHaveBeenCalledWith(4);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useCurrenciesRetrieve', () => {
    it('retrieves currencies and defaults to an empty array', async () => {
      mockApi.getAllCurrencies.mockResolvedValue({ success: true, data: [{ id: 1, code: 'USD' }] });
      const { result } = renderHook(() => useCurrenciesRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.currencies).toHaveLength(1));
      expect(mockApi.getAllCurrencies).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllCurrencies.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useCurrenciesRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllCurrencies).toHaveBeenCalled());
      expect(result.current.currencies).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllCurrencies.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => useCurrenciesRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllCurrencies).toHaveBeenCalledWith(filter));
    });
  });

  describe('useCurrencyAddBatch', () => {
    it('batch adds currencies when data is provided', async () => {
      mockApi.addBatchCurrency.mockResolvedValue({ success: true });
      const currencies = [{ code: 'USD' } as never];
      const { result } = renderHook(() => useCurrencyAddBatch({ currencies }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchCurrency).toHaveBeenCalledWith(currencies);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no currencies are provided', async () => {
      const { result } = renderHook(() => useCurrencyAddBatch({ currencies: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchCurrency).not.toHaveBeenCalled();
    });
  });
});
