import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { usePresetAdd } from '../usePresetAdd';
import { usePresetAddBatch } from '../usePresetAddBatch';
import { usePresetDelete } from '../usePresetDelete';
import { usePresetsRetrieve } from '../usePresetsRetrieve';
import { usePresetUpdate } from '../usePresetUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('preset hooks', () => {
  const mockApi = {
    addPreset: vi.fn(),
    updatePreset: vi.fn(),
    deletePreset: vi.fn(),
    getAllPresets: vi.fn(),
    addBatchPreset: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('usePresetAdd', () => {
    it('adds a preset and unwraps the response data', async () => {
      mockApi.addPreset.mockResolvedValue({ success: true, data: { id: 1, name: 'Preset A' } });
      const { result } = renderHook(() => usePresetAdd({ preset: { name: 'Preset A' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addPreset).toHaveBeenCalledWith({ name: 'Preset A' });
      expect(result.current.data).toEqual({ id: 1, name: 'Preset A' });
    });

    it('resolves to undefined data when no preset is provided', async () => {
      const { result } = renderHook(() => usePresetAdd({ preset: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addPreset).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('usePresetUpdate', () => {
    it('updates a preset and returns the full response', async () => {
      mockApi.updatePreset.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(() => usePresetUpdate({ preset: { id: 1, name: 'Updated' } as never }), {
        wrapper
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updatePreset).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no preset is provided', async () => {
      const { result } = renderHook(() => usePresetUpdate({ preset: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updatePreset).not.toHaveBeenCalled();
    });
  });

  describe('usePresetDelete', () => {
    it('deletes a preset by id', async () => {
      mockApi.deletePreset.mockResolvedValue({ success: true });
      const { result } = renderHook(() => usePresetDelete({ id: 3 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deletePreset).toHaveBeenCalledWith(3);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('usePresetsRetrieve', () => {
    it('retrieves presets and defaults to an empty array', async () => {
      mockApi.getAllPresets.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Preset A' }] });
      const { result } = renderHook(() => usePresetsRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.presets).toHaveLength(1));
      expect(mockApi.getAllPresets).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllPresets.mockResolvedValue({ success: false });
      const { result } = renderHook(() => usePresetsRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllPresets).toHaveBeenCalled());
      expect(result.current.presets).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllPresets.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => usePresetsRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllPresets).toHaveBeenCalledWith(filter));
    });
  });

  describe('usePresetAddBatch', () => {
    it('batch adds presets when data is provided', async () => {
      mockApi.addBatchPreset.mockResolvedValue({ success: true });
      const presets = [{ name: 'Preset A' } as never];
      const { result } = renderHook(() => usePresetAddBatch({ presets }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchPreset).toHaveBeenCalledWith(presets);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no presets are provided', async () => {
      const { result } = renderHook(() => usePresetAddBatch({ presets: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchPreset).not.toHaveBeenCalled();
    });
  });
});
