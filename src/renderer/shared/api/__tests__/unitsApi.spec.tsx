import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { getApi } from '../restApi';
import {
  unitsApi,
  useAddUnitMutation,
  useAddUnitsBatchMutation,
  useDeleteUnitMutation,
  useGetUnitsQuery,
  useUpdateUnitMutation
} from '../unitsApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('unitsApi', () => {
  const mockApi = {
    getAllUnits: vi.fn(),
    addUnit: vi.fn(),
    addBatchUnit: vi.fn(),
    updateUnit: vi.fn(),
    deleteUnit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(unitsApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetUnitsQuery', () => {
    it('returns the unit list on success', async () => {
      mockApi.getAllUnits.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'pcs' }]
      });

      const { result } = renderHook(() => useGetUnitsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllUnits).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, name: 'pcs' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllUnits.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetUnitsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllUnits.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetUnitsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a unit and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllUnits.mockResolvedValue({ success: true, data: [] });
      mockApi.addUnit.mockResolvedValue({ success: true, data: { id: 2, name: 'hrs' } });

      const { result: queryResult } = renderHook(() => useGetUnitsQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddUnitMutation(), { wrapper });
      const [addUnit] = mutationResult.current;

      mockApi.getAllUnits.mockResolvedValue({ success: true, data: [{ id: 2, name: 'hrs' }] });
      await addUnit({ name: 'hrs' } as never);

      expect(mockApi.addUnit).toHaveBeenCalledWith({ name: 'hrs' });
      await waitFor(() => expect(mockApi.getAllUnits).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, name: 'hrs' }]));
    });

    it('adds a batch of units', async () => {
      mockApi.addBatchUnit.mockResolvedValue({ success: true, data: [{ id: 3, name: 'kg' }] });

      const { result } = renderHook(() => useAddUnitsBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await addBatch([{ name: 'kg' } as never]);

      expect(mockApi.addBatchUnit).toHaveBeenCalledWith([{ name: 'kg' }]);
      expect(response).toEqual({ data: [{ id: 3, name: 'kg' }] });
    });

    it('updates a unit', async () => {
      mockApi.updateUnit.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });

      const { result } = renderHook(() => useUpdateUnitMutation(), { wrapper });
      const [updateUnit] = result.current;

      const response = await updateUnit({ id: 1, name: 'Updated' } as never);

      expect(mockApi.updateUnit).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(response).toEqual({ data: { id: 1, name: 'Updated' } });
    });

    it('deletes a unit and surfaces API errors', async () => {
      mockApi.deleteUnit.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteUnitMutation(), { wrapper });
      const [deleteUnit] = result.current;

      const response = await deleteUnit(1);

      expect(mockApi.deleteUnit).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
