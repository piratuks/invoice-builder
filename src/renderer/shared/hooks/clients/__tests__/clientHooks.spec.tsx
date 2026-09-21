import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { useClientAdd } from '../useClientAdd';
import { useClientAddBatch } from '../useClientAddBatch';
import { useClientDelete } from '../useClientDelete';
import { useClientsRetrieve } from '../useClientsRetrieve';
import { useClientUpdate } from '../useClientUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('client hooks', () => {
  const mockApi = {
    addClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    getAllClients: vi.fn(),
    addBatchClient: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useClientAdd', () => {
    it('adds a client and unwraps the response data', async () => {
      mockApi.addClient.mockResolvedValue({ success: true, data: { id: 1, name: 'Client A' } });
      const { result } = renderHook(() => useClientAdd({ client: { name: 'Client A' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addClient).toHaveBeenCalledWith({ name: 'Client A' });
      expect(result.current.data).toEqual({ id: 1, name: 'Client A' });
    });

    it('resolves to undefined data when no client is provided', async () => {
      const { result } = renderHook(() => useClientAdd({ client: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addClient).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useClientUpdate', () => {
    it('updates a client and returns the full response', async () => {
      mockApi.updateClient.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(() => useClientUpdate({ client: { id: 1, name: 'Updated' } as never }), {
        wrapper
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateClient).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no client is provided', async () => {
      const { result } = renderHook(() => useClientUpdate({ client: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateClient).not.toHaveBeenCalled();
    });
  });

  describe('useClientDelete', () => {
    it('deletes a client by id', async () => {
      mockApi.deleteClient.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useClientDelete({ id: 9 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteClient).toHaveBeenCalledWith(9);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useClientsRetrieve', () => {
    it('retrieves clients and defaults to an empty array', async () => {
      mockApi.getAllClients.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Client A' }] });
      const { result } = renderHook(() => useClientsRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.clients).toHaveLength(1));
      expect(mockApi.getAllClients).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllClients.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useClientsRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllClients).toHaveBeenCalled());
      expect(result.current.clients).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllClients.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => useClientsRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllClients).toHaveBeenCalledWith(filter));
    });
  });

  describe('useClientAddBatch', () => {
    it('batch adds clients when data is provided', async () => {
      mockApi.addBatchClient.mockResolvedValue({ success: true });
      const clients = [{ name: 'Client A' } as never];
      const { result } = renderHook(() => useClientAddBatch({ clients }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchClient).toHaveBeenCalledWith(clients);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no clients are provided', async () => {
      const { result } = renderHook(() => useClientAddBatch({ clients: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchClient).not.toHaveBeenCalled();
    });
  });
});
