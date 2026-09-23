import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import {
  banksApi,
  useAddBankMutation,
  useAddBanksBatchMutation,
  useDeleteBankMutation,
  useGetBanksQuery,
  useUpdateBankMutation
} from '../banksApi';
import { getApi } from '../restApi';
import { runApiTrigger } from './testUtils';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('banksApi', () => {
  const mockApi = {
    getAllBanks: vi.fn(),
    addBank: vi.fn(),
    addBatchBank: vi.fn(),
    updateBank: vi.fn(),
    deleteBank: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(banksApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetBanksQuery', () => {
    it('returns the bank list on success', async () => {
      mockApi.getAllBanks.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Main Bank' }]
      });

      const { result } = renderHook(() => useGetBanksQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllBanks).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, name: 'Main Bank' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllBanks.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetBanksQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllBanks.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetBanksQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a bank and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllBanks.mockResolvedValue({ success: true, data: [] });
      mockApi.addBank.mockResolvedValue({ success: true, data: { id: 2, name: 'New Bank' } });

      const { result: queryResult } = renderHook(() => useGetBanksQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddBankMutation(), { wrapper });
      const [addBank] = mutationResult.current;

      mockApi.getAllBanks.mockResolvedValue({ success: true, data: [{ id: 2, name: 'New Bank' }] });
      await runApiTrigger(() => addBank({ name: 'New Bank' } as never));

      expect(mockApi.addBank).toHaveBeenCalledWith({ name: 'New Bank' });
      await waitFor(() => expect(mockApi.getAllBanks).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, name: 'New Bank' }]));
    });

    it('adds a batch of banks', async () => {
      mockApi.addBatchBank.mockResolvedValue({ success: true, data: [{ id: 3, name: 'Batch Bank' }] });

      const { result } = renderHook(() => useAddBanksBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await runApiTrigger(() => addBatch([{ name: 'Batch Bank' } as never]));

      expect(mockApi.addBatchBank).toHaveBeenCalledWith([{ name: 'Batch Bank' }]);
      expect(response).toEqual({ data: [{ id: 3, name: 'Batch Bank' }] });
    });

    it('updates a bank', async () => {
      mockApi.updateBank.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });

      const { result } = renderHook(() => useUpdateBankMutation(), { wrapper });
      const [updateBank] = result.current;

      const response = await runApiTrigger(() => updateBank({ id: 1, name: 'Updated' } as never));

      expect(mockApi.updateBank).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(response).toEqual({ data: { id: 1, name: 'Updated' } });
    });

    it('deletes a bank and surfaces API errors', async () => {
      mockApi.deleteBank.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteBankMutation(), { wrapper });
      const [deleteBank] = result.current;

      const response = await runApiTrigger(() => deleteBank(1));

      expect(mockApi.deleteBank).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
