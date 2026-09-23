import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { store } from '../../../state/configureStore';
import { DatabaseType } from '../../enums/databaseType';
import { DBInitType } from '../../enums/dbInitType';
import {
  dbSelectorApi,
  useInitializeDatabaseMutation,
  useLazyGetDatabaseListQuery,
  useOpenDatabaseMutation,
  useSelectDatabaseMutation,
  useTestConnectionMutation
} from '../dbSelectorApi';
import { getApi } from '../restApi';

vi.mock('../restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  </Provider>
);

describe('dbSelectorApi', () => {
  const mockApi = {
    getDatabaseList: vi.fn(),
    selectDatabase: vi.fn(),
    openDatabase: vi.fn(),
    initializeDatabase: vi.fn(),
    testConnection: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(dbSelectorApi.util.resetApiState());
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  it('loads the database list through the lazy query', async () => {
    mockApi.getDatabaseList.mockResolvedValue({ success: true, data: ['one.db', 'two.db'] });
    const query = renderHook(() => useLazyGetDatabaseListQuery(), { wrapper });
    const [trigger] = query.result.current;
    const response = await trigger().unwrap();
    expect(response).toEqual(['one.db', 'two.db']);
    expect(mockApi.getDatabaseList).toHaveBeenCalledTimes(1);
  });

  it('routes picker, initialization, and connection mutations', async () => {
    mockApi.selectDatabase.mockResolvedValue({ success: true, data: { canceled: false, filePath: 'new.db' } });
    mockApi.openDatabase.mockResolvedValue({ success: true, data: { canceled: false, filePath: 'old.db' } });
    mockApi.initializeDatabase.mockResolvedValue({ success: true, data: undefined });
    mockApi.testConnection.mockResolvedValue({ success: true, data: undefined });

    const select = renderHook(() => useSelectDatabaseMutation(), { wrapper });
    const open = renderHook(() => useOpenDatabaseMutation(), { wrapper });
    const init = renderHook(() => useInitializeDatabaseMutation(), { wrapper });
    const test = renderHook(() => useTestConnectionMutation(), { wrapper });

    await select.result.current[0]();
    await open.result.current[0]();
    await init.result.current[0]({ fullPath: 'new.db', mode: DBInitType.create, dbType: DatabaseType.sqlite });
    await test.result.current[0]({ host: 'localhost', port: 5432, user: 'u', database: 'db', ssl: false });

    expect(mockApi.selectDatabase).toHaveBeenCalledTimes(1);
    expect(mockApi.openDatabase).toHaveBeenCalledTimes(1);
    expect(mockApi.initializeDatabase).toHaveBeenCalledWith({
      fullPath: 'new.db',
      mode: DBInitType.create,
      dbType: DatabaseType.sqlite
    });
    expect(mockApi.testConnection).toHaveBeenCalledWith({
      host: 'localhost',
      port: 5432,
      user: 'u',
      database: 'db',
      ssl: false
    });
  });

  it('normalizes failed database operations', async () => {
    mockApi.testConnection.mockResolvedValue({ success: false, key: 'error.connectionFailed' });
    const test = renderHook(() => useTestConnectionMutation(), { wrapper });
    const response = await test.result.current[0]({ host: 'h', port: 1, user: 'u', database: 'd', ssl: false });
    expect(response).toEqual({ error: { kind: 'response', message: undefined, key: 'error.connectionFailed' } });
  });
});
