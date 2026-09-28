import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import {
  clientsApi,
  useAddClientMutation,
  useAddClientsBatchMutation,
  useDeleteClientMutation,
  useGetClientsQuery,
  useUpdateClientMutation
} from '../clientsApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('clientsApi', () => {
  const mockApi = {
    getAllClients: vi.fn(),
    addClient: vi.fn(),
    addBatchClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(clientsApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetClientsQuery', () => {
    it('returns the client list on success', async () => {
      mockApi.getAllClients.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'John Doe' }]
      });

      const { result } = renderHook(() => useGetClientsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllClients).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, name: 'John Doe' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllClients.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetClientsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllClients.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetClientsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a client and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllClients.mockResolvedValue({ success: true, data: [] });
      mockApi.addClient.mockResolvedValue({ success: true, data: { id: 2, name: 'New Client' } });

      const { result: queryResult } = renderHook(() => useGetClientsQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddClientMutation(), { wrapper });
      const [addClient] = mutationResult.current;

      mockApi.getAllClients.mockResolvedValue({ success: true, data: [{ id: 2, name: 'New Client' }] });
      await addClient({ name: 'New Client' } as never);

      expect(mockApi.addClient).toHaveBeenCalledWith({ name: 'New Client' });
      await waitFor(() => expect(mockApi.getAllClients).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, name: 'New Client' }]));
    });

    it('adds a batch of clients', async () => {
      mockApi.addBatchClient.mockResolvedValue({ success: true, data: [{ id: 3, name: 'Batch Client' }] });

      const { result } = renderHook(() => useAddClientsBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await addBatch([{ name: 'Batch Client' } as never]);

      expect(mockApi.addBatchClient).toHaveBeenCalledWith([{ name: 'Batch Client' }]);
      expect(response).toEqual({ data: [{ id: 3, name: 'Batch Client' }] });
    });

    it('updates a client', async () => {
      mockApi.updateClient.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });

      const { result } = renderHook(() => useUpdateClientMutation(), { wrapper });
      const [updateClient] = result.current;

      const response = await updateClient({ id: 1, name: 'Updated' } as never);

      expect(mockApi.updateClient).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(response).toEqual({ data: { id: 1, name: 'Updated' } });
    });

    it('deletes a client and surfaces API errors', async () => {
      mockApi.deleteClient.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteClientMutation(), { wrapper });
      const [deleteClient] = result.current;

      const response = await deleteClient(1);

      expect(mockApi.deleteClient).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
