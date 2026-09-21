import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { useBusinessAdd } from '../useBusinessAdd';
import { useBusinessAddBatch } from '../useBusinessAddBatch';
import { useBusinessDelete } from '../useBusinessDelete';
import { useBusinessesRetrieve } from '../useBusinessesRetrieve';
import { useBusinessUpdate } from '../useBusinessUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('business hooks', () => {
  const mockApi = {
    addBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    deleteBusiness: vi.fn(),
    getAllBusinesses: vi.fn(),
    addBatchBusiness: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useBusinessAdd', () => {
    it('adds a business and unwraps the response data', async () => {
      mockApi.addBusiness.mockResolvedValue({ success: true, data: { id: 1, name: 'Biz A' } });
      const { result } = renderHook(() => useBusinessAdd({ business: { name: 'Biz A' } as never }), { wrapper });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addBusiness).toHaveBeenCalledWith({ name: 'Biz A' });
      expect(result.current.data).toEqual({ id: 1, name: 'Biz A' });
    });

    it('resolves to undefined data when no business is provided', async () => {
      const { result } = renderHook(() => useBusinessAdd({ business: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBusiness).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('does not execute automatically when immediate is false', () => {
      renderHook(() => useBusinessAdd({ business: { name: 'Biz A' } as never, immediate: false }), { wrapper });
      expect(mockApi.addBusiness).not.toHaveBeenCalled();
    });
  });

  describe('useBusinessUpdate', () => {
    it('updates a business and returns the full response', async () => {
      mockApi.updateBusiness.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(() => useBusinessUpdate({ business: { id: 1, name: 'Updated' } as never }), {
        wrapper
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateBusiness).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no business is provided', async () => {
      const { result } = renderHook(() => useBusinessUpdate({ business: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateBusiness).not.toHaveBeenCalled();
    });
  });

  describe('useBusinessDelete', () => {
    it('deletes a business by id', async () => {
      mockApi.deleteBusiness.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useBusinessDelete({ id: 7 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteBusiness).toHaveBeenCalledWith(7);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useBusinessesRetrieve', () => {
    it('retrieves businesses and defaults to an empty array', async () => {
      mockApi.getAllBusinesses.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Biz A' }] });
      const { result } = renderHook(() => useBusinessesRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.businesses).toHaveLength(1));
      expect(mockApi.getAllBusinesses).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllBusinesses.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useBusinessesRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllBusinesses).toHaveBeenCalled());
      expect(result.current.businesses).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllBusinesses.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => useBusinessesRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllBusinesses).toHaveBeenCalledWith(filter));
    });
  });

  describe('useBusinessAddBatch', () => {
    it('batch adds businesses when data is provided', async () => {
      mockApi.addBatchBusiness.mockResolvedValue({ success: true });
      const businesses = [{ name: 'Biz A' } as never];
      const { result } = renderHook(() => useBusinessAddBatch({ businesses }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchBusiness).toHaveBeenCalledWith(businesses);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no businesses are provided', async () => {
      const { result } = renderHook(() => useBusinessAddBatch({ businesses: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchBusiness).not.toHaveBeenCalled();
    });
  });
});
