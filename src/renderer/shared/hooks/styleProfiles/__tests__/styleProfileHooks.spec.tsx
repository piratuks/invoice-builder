import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { useStyleProfileAdd } from '../useStyleProfileAdd';
import { useStyleProfileAddBatch } from '../useStyleProfileAddBatch';
import { useStyleProfileDelete } from '../useStyleProfileDelete';
import { useStyleProfilesRetrieve } from '../useStyleProfilesRetrieve';
import { useStyleProfileUpdate } from '../useStyleProfileUpdate';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('style profile hooks', () => {
  const mockApi = {
    addStyleProfile: vi.fn(),
    updateStyleProfile: vi.fn(),
    deleteStyleProfile: vi.fn(),
    getAllStyleProfiles: vi.fn(),
    addBatchStyleProfile: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useStyleProfileAdd', () => {
    it('adds a style profile and unwraps the response data', async () => {
      mockApi.addStyleProfile.mockResolvedValue({ success: true, data: { id: 1, name: 'Profile A' } });
      const { result } = renderHook(() => useStyleProfileAdd({ styleProfile: { name: 'Profile A' } as never }), {
        wrapper
      });

      await waitFor(() => expect(result.current.data).toBeTruthy());
      expect(mockApi.addStyleProfile).toHaveBeenCalledWith({ name: 'Profile A' });
      expect(result.current.data).toEqual({ id: 1, name: 'Profile A' });
    });

    it('resolves to undefined data when no style profile is provided', async () => {
      const { result } = renderHook(() => useStyleProfileAdd({ styleProfile: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addStyleProfile).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useStyleProfileUpdate', () => {
    it('updates a style profile and returns the full response', async () => {
      mockApi.updateStyleProfile.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });
      const { result } = renderHook(
        () => useStyleProfileUpdate({ styleProfile: { id: 1, name: 'Updated' } as never }),
        { wrapper }
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateStyleProfile).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(result.current.data?.data?.name).toBe('Updated');
    });

    it('resolves to a failure result when no style profile is provided', async () => {
      const { result } = renderHook(() => useStyleProfileUpdate({ styleProfile: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.updateStyleProfile).not.toHaveBeenCalled();
    });
  });

  describe('useStyleProfileDelete', () => {
    it('deletes a style profile by id', async () => {
      mockApi.deleteStyleProfile.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useStyleProfileDelete({ id: 2 }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.deleteStyleProfile).toHaveBeenCalledWith(2);
      expect(result.current.data).toEqual({ success: true });
    });
  });

  describe('useStyleProfilesRetrieve', () => {
    it('retrieves style profiles and defaults to an empty array', async () => {
      mockApi.getAllStyleProfiles.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Profile A' }] });
      const { result } = renderHook(() => useStyleProfilesRetrieve({}), { wrapper });
      await waitFor(() => expect(result.current.styleProfiles).toHaveLength(1));
      expect(mockApi.getAllStyleProfiles).toHaveBeenCalledWith(undefined);
    });

    it('defaults to an empty array when the response has no data', async () => {
      mockApi.getAllStyleProfiles.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useStyleProfilesRetrieve({}), { wrapper });
      await waitFor(() => expect(mockApi.getAllStyleProfiles).toHaveBeenCalled());
      expect(result.current.styleProfiles).toEqual([]);
    });

    it('passes the filter through to the api call', async () => {
      mockApi.getAllStyleProfiles.mockResolvedValue({ success: true, data: [] });
      const filter = [{ type: 'Active' } as never];
      renderHook(() => useStyleProfilesRetrieve({ filter }), { wrapper });
      await waitFor(() => expect(mockApi.getAllStyleProfiles).toHaveBeenCalledWith(filter));
    });
  });

  describe('useStyleProfileAddBatch', () => {
    it('batch adds style profiles when data is provided', async () => {
      mockApi.addBatchStyleProfile.mockResolvedValue({ success: true });
      const styleProfiles = [{ name: 'Profile A' } as never];
      const { result } = renderHook(() => useStyleProfileAddBatch({ styleProfiles }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchStyleProfile).toHaveBeenCalledWith(styleProfiles);
      expect(result.current.data).toEqual({ success: true });
    });

    it('resolves to a failure result when no style profiles are provided', async () => {
      const { result } = renderHook(() => useStyleProfileAddBatch({ styleProfiles: undefined }), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockApi.addBatchStyleProfile).not.toHaveBeenCalled();
    });
  });
});
