import path from 'path';
import { DatabaseType } from '../../shared/enums/databaseType';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';

const mocks = vi.hoisted(() => ({
  mkdirSync: vi.fn(),
  openPostgreSql: vi.fn(),
  openSqlLite: vi.fn(),
  initSchema: vi.fn(),
  initInitialData: vi.fn(),
  runMigrations: vi.fn()
}));

vi.mock('fs', () => ({ default: { mkdirSync: mocks.mkdirSync } }));
vi.mock('../../shared/db/setup', () => ({
  openPostgreSql: mocks.openPostgreSql,
  openSqlLite: mocks.openSqlLite,
  initSchema: mocks.initSchema,
  initInitialData: mocks.initInitialData
}));
vi.mock('../migration', () => ({ runMigrations: mocks.runMigrations }));

const makeDb = () => ({ close: vi.fn().mockResolvedValue(undefined) }) as unknown as DatabaseAdapter;

describe('webserver database setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runMigrations.mockResolvedValue({ success: true });
  });

  it('opens PostgreSQL and initializes a newly created database', async () => {
    const db = makeDb();
    mocks.openPostgreSql.mockResolvedValue({ db });
    const { setupDB } = await import('../database');
    const config = {
      host: 'localhost',
      port: 5432,
      database: 'invoice',
      user: 'user',
      password: 'pw',
      ssl: false
    };

    await setupDB({ dbType: DatabaseType.postgre, postgresConfig: config });

    expect(mocks.openPostgreSql).toHaveBeenCalledWith(config);
    expect(mocks.initSchema).toHaveBeenCalledWith(db);
    expect(mocks.initInitialData).toHaveBeenCalledWith(db);
    expect(mocks.runMigrations).toHaveBeenCalledWith(db);
  });

  it('closes the prior database and opens an existing SQLite file without initialization', async () => {
    const firstDb = makeDb();
    const secondDb = makeDb();
    mocks.openSqlLite.mockResolvedValueOnce({ db: firstDb }).mockResolvedValueOnce({ db: secondDb });
    const { setupDB } = await import('../database');

    // Build paths with the host separator so the dirname assertion holds on Windows and Linux CI.
    const dataDir = path.join('tmp', 'data');
    const firstPath = path.join(dataDir, 'first.db');
    const secondPath = path.join(dataDir, 'second.db');

    await setupDB({ dbType: DatabaseType.sqlite, sqliteConfig: { fullPath: firstPath } });
    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: secondPath },
      createIfMissing: false
    });

    expect(firstDb.close).toHaveBeenCalledTimes(1);
    expect(mocks.mkdirSync).toHaveBeenCalledWith(dataDir, { recursive: true });
    expect(mocks.openSqlLite).toHaveBeenLastCalledWith({ fullPath: secondPath, createIfMissing: false });
    expect(mocks.initSchema).toHaveBeenCalledTimes(1);
  });

  it('validates configuration and database creation results', async () => {
    const { setupDB } = await import('../database');

    await expect(setupDB({ dbType: DatabaseType.postgre })).rejects.toThrow('error.postgresConfig');
    await expect(setupDB({ dbType: 'unsupported' as DatabaseType })).rejects.toThrow('error.noDatabase');
  });

  it('surfaces migration messages and permits a later queued setup after failure', async () => {
    const failedDb = makeDb();
    const recoveredDb = makeDb();
    mocks.openSqlLite.mockResolvedValueOnce({ db: failedDb }).mockResolvedValueOnce({ db: recoveredDb });
    mocks.runMigrations
      .mockResolvedValueOnce({ success: false, message: 'migration detail' })
      .mockResolvedValueOnce(undefined);
    const { setupDB } = await import('../database');

    await expect(setupDB({ dbType: DatabaseType.sqlite })).rejects.toThrow('migration detail');
    await expect(setupDB({ dbType: DatabaseType.sqlite })).resolves.toBeUndefined();
    expect(failedDb.close).toHaveBeenCalledTimes(1);
  });

  it('uses the default migration error when no message is supplied', async () => {
    mocks.openSqlLite.mockResolvedValue({ db: makeDb() });
    mocks.runMigrations.mockResolvedValue({ success: false });
    const { setupDB } = await import('../database');

    await expect(setupDB({ dbType: DatabaseType.sqlite, sqliteConfig: {} })).rejects.toThrow('error.failedMigration');
  });
});
