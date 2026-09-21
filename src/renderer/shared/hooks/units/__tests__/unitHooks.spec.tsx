import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { selectUnitsOptions } from '../../../../state/pageSlice';
import { getApi } from '../../../api/restApi';
import { useUnitAdd } from '../useUnitAdd';
import { useUnitAddBatch } from '../useUnitAddBatch';
import { useUnitDelete } from '../useUnitDelete';
import { useUnitsRetrieve } from '../useUnitsRetrieve';
import { useUnitUpdate } from '../useUnitUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('unit hooks', () => {
  const mockApi = {
    addUnit: vi.fn(),
    updateUnit: vi.fn(),
    deleteUnit: vi.fn(),
    getAllUnits: vi.fn(),
    addBatchUnit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useUnitAdd', () => {
    it('adds a unit and unwraps the response data', async () => {
      mockApi.addUnit.mockResolvedValue({ success: true, data: { id: 1, name: 'Unit A' } });
      const { result } = renderHook(() => useUnitAdd({ unit: { name: 'Unit A' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addUnit).toHaveBeenCalledWith({ name: 'Unit A' });
      expect(result.current.data).toEqual({ id: 1, name: 'Unit A' });
    });

    it('resolves to undefined data when no unit is provided', async () => {
      const { result } = renderHook(() => useUnitAdd({ unit: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addUnit).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useUnitUpdate', () => {
    it('updates a unit and returns the full response', async () => {
      mockApi.updateUnit.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(() => useUnitUpdate({ unit: { id: 1, name: 'Updated' } as never }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateUnit).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no unit is provided', async () => {
      const { result } = renderHook(() => useUnitUpdate({ unit: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateUnit).not.toHaveBeenCalled();
    });
  });

  describe('useUnitDelete', () => {
    it('deletes a unit by id', async () => {
      mockApi.deleteUnit.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useUnitDelete({ id: 6 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteUnit).toHaveBeenCalledWith(6);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useUnitsRetrieve', () => {
    it('retrieves units, defaults to an empty array and syncs store options', async () => {
      mockApi.getAllUnits.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Unit A' }] });
      const { result } = renderHook(() => useUnitsRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.units).toHaveLength(1));
      expect(mockApi.getAllUnits).toHaveBeenCalledWith(undefined);
      await waitFor(() => expect(selectUnitsOptions(store.getState())).toEqual([{ label: 'Unit A', value: 1 }]));
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllUnits.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useUnitsRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllUnits).toHaveBeenCalled());
      expect(result.current.units).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllUnits.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => useUnitsRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllUnits).toHaveBeenCalledWith(filter));
    });
  });

  describe('useUnitAddBatch', () => {
    it('batch adds units when data is provided', async () => {
      mockApi.addBatchUnit.mockResolvedValue({ success: true });
      const units = [{ name: 'Unit A' } as never];
      const { result } = renderHook(() => useUnitAddBatch({ units }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchUnit).toHaveBeenCalledWith(units);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no units are provided', async () => {
      const { result } = renderHook(() => useUnitAddBatch({ units: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchUnit).not.toHaveBeenCalled();
    });
  });
});
