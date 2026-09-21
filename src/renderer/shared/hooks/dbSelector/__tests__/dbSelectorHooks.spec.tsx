import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../../i18n';
import { store } from '../../../../state/configureStore';
import { getApi } from '../../../api/restApi';
import { DatabaseType } from '../../../enums/databaseType';
import { DBInitType } from '../../../enums/dbInitType';
import { useDBInit } from '../useDBInit';
import { useDBListSelector } from '../useDBListSelector';
import { useDBOpener } from '../useDBOpener';
import { useDBSelector } from '../useDBSelector';
import { useTestConnection } from '../useDBTestConnection';

vi.mock('../../../api/restApi', () => ({ getApi: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('dbSelector hooks', () => {
  const mockApi = {
    initializeDatabase: vi.fn(),
    getDatabaseList: vi.fn(),
    openDatabase: vi.fn(),
    selectDatabase: vi.fn(),
    testConnection: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  describe('useDBInit', () => {
    it('initializes the database with the given config', async () => {
      mockApi.initializeDatabase.mockResolvedValue({ success: true });
      const { result } = renderHook(
        () => useDBInit({ dbType: DatabaseType.sqlite, fullPath: '/tmp/db', mode: DBInitType.create }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.data).toEqual({ success: true }));
      expect(mockApi.initializeDatabase).toHaveBeenCalledWith({
        postgresConfig: undefined,
        fullPath: '/tmp/db',
        mode: DBInitType.create,
        dbType: DatabaseType.sqlite
      });
    });
  });

  describe('useDBListSelector', () => {
    it('retrieves the database list', async () => {
      mockApi.getDatabaseList.mockResolvedValue({ success: true, data: ['db1', 'db2'] });
      const { result } = renderHook(() => useDBListSelector({}), { wrapper });
      await waitFor(() => expect(result.current.businesses).toEqual(['db1', 'db2']));
    });

    it('defaults to an empty array when there is no data', async () => {
      mockApi.getDatabaseList.mockResolvedValue({ success: false });
      const { result } = renderHook(() => useDBListSelector({}), { wrapper });
      await waitFor(() => expect(mockApi.getDatabaseList).toHaveBeenCalled());
      expect(result.current.businesses).toEqual([]);
    });
  });

  describe('useDBOpener', () => {
    it('opens an existing database', async () => {
      mockApi.openDatabase.mockResolvedValue({ success: true, data: { canceled: false, filePath: '/tmp/db' } });
      const { result } = renderHook(() => useDBOpener({}), { wrapper });
      await waitFor(() => expect(result.current.data?.data?.filePath).toBe('/tmp/db'));
    });
  });

  describe('useDBSelector', () => {
    it('opens the database selector dialog', async () => {
      mockApi.selectDatabase.mockResolvedValue({ success: true, data: { canceled: true, filePath: '' } });
      const { result } = renderHook(() => useDBSelector({}), { wrapper });
      await waitFor(() => expect(result.current.data?.data?.canceled).toBe(true));
      expect(mockApi.selectDatabase).toHaveBeenCalled();
    });
  });

  describe('useTestConnection', () => {
    it('tests a postgres connection', async () => {
      mockApi.testConnection.mockResolvedValue({ success: true });
      const postgresConfig = { host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'db', ssl: false };
      const { result } = renderHook(() => useTestConnection({ postgresConfig }), { wrapper });
      await waitFor(() => expect(result.current.data).toEqual({ success: true }));
      expect(mockApi.testConnection).toHaveBeenCalledWith(postgresConfig);
    });
  });
});
