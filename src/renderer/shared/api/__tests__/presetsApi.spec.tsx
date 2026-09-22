import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import {
  presetsApi,
  useAddPresetMutation,
  useAddPresetsBatchMutation,
  useDeletePresetMutation,
  useGetPresetsQuery,
  useUpdatePresetMutation
} from '../presetsApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('presetsApi', () => {
  const mockApi = {
    getAllPresets: vi.fn(),
    addPreset: vi.fn(),
    addBatchPreset: vi.fn(),
    updatePreset: vi.fn(),
    deletePreset: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(presetsApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetPresetsQuery', () => {
    it('returns the preset list on success', async () => {
      mockApi.getAllPresets.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Core preset' }]
      });

      const { result } = renderHook(() => useGetPresetsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllPresets).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, name: 'Core preset' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllPresets.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetPresetsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllPresets.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetPresetsQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a preset and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllPresets.mockResolvedValue({ success: true, data: [] });
      mockApi.addPreset.mockResolvedValue({ success: true, data: { id: 2, name: 'New Preset' } });

      const { result: queryResult } = renderHook(() => useGetPresetsQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddPresetMutation(), { wrapper });
      const [addPreset] = mutationResult.current;

      mockApi.getAllPresets.mockResolvedValue({ success: true, data: [{ id: 2, name: 'New Preset' }] });
      await addPreset({ name: 'New Preset' } as never);

      expect(mockApi.addPreset).toHaveBeenCalledWith({ name: 'New Preset' });
      await waitFor(() => expect(mockApi.getAllPresets).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, name: 'New Preset' }]));
    });

    it('adds a batch of presets', async () => {
      mockApi.addBatchPreset.mockResolvedValue({ success: true, data: [{ id: 3, name: 'Batch Preset' }] });

      const { result } = renderHook(() => useAddPresetsBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await addBatch([{ name: 'Batch Preset' } as never]);

      expect(mockApi.addBatchPreset).toHaveBeenCalledWith([{ name: 'Batch Preset' }]);
      expect(response).toEqual({ data: [{ id: 3, name: 'Batch Preset' }] });
    });

    it('updates a preset', async () => {
      mockApi.updatePreset.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });

      const { result } = renderHook(() => useUpdatePresetMutation(), { wrapper });
      const [updatePreset] = result.current;

      const response = await updatePreset({ id: 1, name: 'Updated' } as never);

      expect(mockApi.updatePreset).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(response).toEqual({ data: { id: 1, name: 'Updated' } });
    });

    it('deletes a preset and surfaces API errors', async () => {
      mockApi.deletePreset.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeletePresetMutation(), { wrapper });
      const [deletePreset] = result.current;

      const response = await deletePreset(1);

      expect(mockApi.deletePreset).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
