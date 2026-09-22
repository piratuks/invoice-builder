import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { getApi } from '../restApi';
import {
  styleProfilesApi,
  useAddStyleProfileMutation,
  useAddStyleProfilesBatchMutation,
  useDeleteStyleProfileMutation,
  useGetStyleProfilesQuery,
  useUpdateStyleProfileMutation
} from '../styleProfilesApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('styleProfilesApi', () => {
  const mockApi = {
    getAllStyleProfiles: vi.fn(),
    addStyleProfile: vi.fn(),
    addBatchStyleProfile: vi.fn(),
    updateStyleProfile: vi.fn(),
    deleteStyleProfile: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(styleProfilesApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useGetStyleProfilesQuery', () => {
    it('returns the style profile list on success', async () => {
      mockApi.getAllStyleProfiles.mockResolvedValue({
        success: true,
        data: [{ id: 1, name: 'Test Profile' }]
      });

      const { result } = renderHook(() => useGetStyleProfilesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.getAllStyleProfiles).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([{ id: 1, name: 'Test Profile' }]);
    });

    it('surfaces an error when the API call fails', async () => {
      mockApi.getAllStyleProfiles.mockResolvedValue({ success: false, message: 'boom' });

      const { result } = renderHook(() => useGetStyleProfilesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'response', message: 'boom', key: undefined });
    });

    it('tags thrown exceptions distinctly from business-logic failures', async () => {
      mockApi.getAllStyleProfiles.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useGetStyleProfilesQuery(undefined), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual({ kind: 'exception', message: 'network down' });
    });
  });

  describe('mutations', () => {
    it('adds a style profile and invalidates the list so a refetch occurs', async () => {
      mockApi.getAllStyleProfiles.mockResolvedValue({ success: true, data: [] });
      mockApi.addStyleProfile.mockResolvedValue({ success: true, data: { id: 2, name: 'New Profile' } });

      const { result: queryResult } = renderHook(() => useGetStyleProfilesQuery(undefined), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));

      const { result: mutationResult } = renderHook(() => useAddStyleProfileMutation(), { wrapper });
      const [addStyleProfile] = mutationResult.current;

      mockApi.getAllStyleProfiles.mockResolvedValue({ success: true, data: [{ id: 2, name: 'New Profile' }] });
      await addStyleProfile({ name: 'New Profile' } as never);

      expect(mockApi.addStyleProfile).toHaveBeenCalledWith({ name: 'New Profile' });
      await waitFor(() => expect(mockApi.getAllStyleProfiles).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(queryResult.current.data).toEqual([{ id: 2, name: 'New Profile' }]));
    });

    it('adds a batch of style profiles', async () => {
      mockApi.addBatchStyleProfile.mockResolvedValue({ success: true, data: [{ id: 3, name: 'Batch Profile' }] });

      const { result } = renderHook(() => useAddStyleProfilesBatchMutation(), { wrapper });
      const [addBatch] = result.current;

      const response = await addBatch([{ name: 'Batch Profile' } as never]);

      expect(mockApi.addBatchStyleProfile).toHaveBeenCalledWith([{ name: 'Batch Profile' }]);
      expect(response).toEqual({ data: [{ id: 3, name: 'Batch Profile' }] });
    });

    it('updates a style profile', async () => {
      mockApi.updateStyleProfile.mockResolvedValue({ success: true, data: { id: 1, name: 'Updated' } });

      const { result } = renderHook(() => useUpdateStyleProfileMutation(), { wrapper });
      const [updateStyleProfile] = result.current;

      const response = await updateStyleProfile({ id: 1, name: 'Updated' } as never);

      expect(mockApi.updateStyleProfile).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
      expect(response).toEqual({ data: { id: 1, name: 'Updated' } });
    });

    it('deletes a style profile and surfaces API errors', async () => {
      mockApi.deleteStyleProfile.mockResolvedValue({ success: false, key: 'error.deleteFailed' });

      const { result } = renderHook(() => useDeleteStyleProfileMutation(), { wrapper });
      const [deleteStyleProfile] = result.current;

      const response = await deleteStyleProfile(1);

      expect(mockApi.deleteStyleProfile).toHaveBeenCalledWith(1);
      expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.deleteFailed' } });
    });
  });
});
