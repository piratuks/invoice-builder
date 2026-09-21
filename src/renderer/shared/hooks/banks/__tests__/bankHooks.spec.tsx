import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { useBankAdd } from '../useBankAdd';
import { useBankAddBatch } from '../useBankAddBatch';
import { useBankDelete } from '../useBankDelete';
import { useBanksRetrieve } from '../useBanksRetrieve';
import { useBankUpdate } from '../useBankUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('bank hooks', () => {
  const mockApi = {
    addBank: vi.fn(),
    updateBank: vi.fn(),
    deleteBank: vi.fn(),
    getAllBanks: vi.fn(),
    addBatchBank: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useBankAdd', () => {
    it('adds a bank immediately when data is provided', async () => {
      mockApi.addBank.mockResolvedValue({ success: true, data: { id: 1 } });
      const { result } = renderHook(() => useBankAdd({ bank: { name: 'Bank A' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addBank).toHaveBeenCalledWith({ name: 'Bank A' });
      expect(result.current.data).toEqual({ id: 1 });
    });

    it('resolves to a failure result when no bank is provided', async () => {
      const { result } = renderHook(() => useBankAdd({ bank: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBank).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('does not execute automatically when immediate is false', () => {
      renderHook(() => useBankAdd({ bank: { name: 'Bank A' } as never, immediate: false }), { wrapper });
      expect(mockApi.addBank).not.toHaveBeenCalled();
    });
  });

  describe('useBankUpdate', () => {
    it('updates a bank when data is provided', async () => {
      mockApi.updateBank.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(() => useBankUpdate({ bank: { id: 1, name: 'Updated' } as never }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateBank).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no bank is provided', async () => {
      const { result } = renderHook(() => useBankUpdate({ bank: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateBank).not.toHaveBeenCalled();
    });
  });

  describe('useBankDelete', () => {
    it('deletes a bank by id', async () => {
      mockApi.deleteBank.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useBankDelete({ id: 5 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteBank).toHaveBeenCalledWith(5);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useBanksRetrieve', () => {
    it('retrieves banks and defaults to an empty array', async () => {
      mockApi.getAllBanks.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Bank A' }] });
      const { result } = renderHook(() => useBanksRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.banks).toHaveLength(1));
      expect(mockApi.getAllBanks).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllBanks.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useBanksRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllBanks).toHaveBeenCalled());
      expect(result.current.banks).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllBanks.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => useBanksRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllBanks).toHaveBeenCalledWith(filter));
    });
  });

  describe('useBankAddBatch', () => {
    it('batch adds banks when data is provided', async () => {
      mockApi.addBatchBank.mockResolvedValue({ success: true });
      const banks = [{ name: 'Bank A' } as never];
      const { result } = renderHook(() => useBankAddBatch({ banks }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchBank).toHaveBeenCalledWith(banks);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no banks are provided', async () => {
      const { result } = renderHook(() => useBankAddBatch({ banks: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchBank).not.toHaveBeenCalled();
    });
  });
});
