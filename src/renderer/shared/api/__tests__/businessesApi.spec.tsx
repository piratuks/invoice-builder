import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import {
  businessesApi,
  useAddBusinessesBatchMutation,
  useAddBusinessMutation,
  useDeleteBusinessMutation,
  useGetBusinessesQuery,
  useUpdateBusinessMutation
} from '../businessesApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('businessesApi', () => {
  const mockApi = {
    getAllBusinesses: vi.fn(),
    addBusiness: vi.fn(),
    addBatchBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    deleteBusiness: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(businessesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetBusinessesQuery', () => {
    it('returns the business list on success', async () => {
      mockApi.getAllBusinesses.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Acme Corp' }]
      });

      const { result } = renderHook(() => useGetBusinessesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllBusinesses).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, name: 'Acme Corp' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllBusinesses.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetBusinessesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllBusinesses.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetBusinessesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a business and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllBusinesses.mockResolvedValue({ success: true, data: [] });
      mockApi.addBusiness.mockResolvedValue({ success: true, data: { id: 2, name: 'New Biz' } });

      const { result: queryResult } = renderHook(() => useGetBusinessesQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddBusinessMutation(), { wrapper });
      const [addBusiness] = mutationResult.current;

      mockApi.getAllBusinesses.mockResolvedValue({ success: true, data: [{ id: 2, name: 'New Biz' }] });
      await addBusiness({ name: 'New Biz' } as never);

      expect(mockApi.addBusiness).toHaveBeenCalledWith({ name: 'New Biz' });
      await waitFor(() => expect(mockApi.getAllBusinesses).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, name: 'New Biz' }]));
    });

    it('adds a batch of businesses', async () => {
      mockApi.addBatchBusiness.mockResolvedValue({ success: true, data: [{ id: 3, name: 'Batch Biz' }] });

      const { result } = renderHook(() => useAddBusinessesBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await addBatch([{ name: 'Batch Biz' } as never]);

      expect(mockApi.addBatchBusiness).toHaveBeenCalledWith([{ name: 'Batch Biz' }]);
      expect(response).toEqual({ data: [{ id: 3, name: 'Batch Biz' }] });
    });

    it('updates a business', async () => {
      mockApi.updateBusiness.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });

      const { result } = renderHook(() => useUpdateBusinessMutation(), { wrapper });
      const [updateBusiness] = result.current;

      const response = await updateBusiness({ id: 1, name: 'Updated' } as never);

      expect(mockApi.updateBusiness).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(response).toEqual({ data: { id: 1, name: 'Updated' } });
    });

    it('deletes a business and surfaces API errors', async () => {
      mockApi.deleteBusiness.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteBusinessMutation(), { wrapper });
      const [deleteBusiness] = result.current;

      const response = await deleteBusiness(1);

      expect(mockApi.deleteBusiness).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
