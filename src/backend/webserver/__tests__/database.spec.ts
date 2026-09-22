import path from 'path';
import { DatabaseType } from '../../shared/enums/databaseType';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';
import { clearSessions, issueSession } from '../session';

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
const makeDb = () =>
  ({
    run: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue(null),
    close: vi.fn().mockResolvedValue(undefined)
  }) as unknown as DatabaseAdapter;

describe('webserver database setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runMigrations.mockResolvedValue({ success: true });
    return clearSessions();
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

    await setupDB({ dbType: DatabaseType.postgre, postgresConfig: config, databaseKey: 'postgres-test' });

    expect(mocks.openPostgreSql).toHaveBeenCalledWith(config);
    expect(mocks.initSchema).toHaveBeenCalledWith(db);
    expect(mocks.initInitialData).toHaveBeenCalledWith(db);
    expect(mocks.runMigrations).toHaveBeenCalledWith(db);
  });

  it('restores PostgreSQL for an existing session after a server restart', async () => {
    const db = makeDb();
    const config = {
      host: 'localhost',
      port: 5432,
      database: 'invoice',
      user: 'user',
      password: 'pw',
      ssl: false
    };
    mocks.openPostgreSql.mockResolvedValue({ db });
    const { restorePostgresDatabase, getRequestDatabase } = await import('../database');

    await expect(restorePostgresDatabase('postgres-recovery', config)).resolves.toBe(db);

    expect(mocks.openPostgreSql).toHaveBeenCalledWith(config);
    expect(mocks.runMigrations).toHaveBeenCalledWith(db);
    expect(getRequestDatabase({ headers: { 'x-database-key': 'postgres-recovery' } } as never)).toBe(db);
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

    await setupDB({ dbType: DatabaseType.sqlite, sqliteConfig: { fullPath: firstPath }, databaseKey: 'first-db' });
    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: secondPath },
      createIfMissing: false,
      databaseKey: 'first-db'
    });

    expect(firstDb.close).toHaveBeenCalledTimes(1);
    expect(mocks.mkdirSync).toHaveBeenCalledWith(dataDir, { recursive: true });
    expect(mocks.openSqlLite).toHaveBeenLastCalledWith({ fullPath: secondPath, createIfMissing: false });
    expect(mocks.initSchema).toHaveBeenCalledTimes(1);
  });

  it('validates configuration and database creation results', async () => {
    const { setupDB } = await import('../database');

    await expect(setupDB({ dbType: DatabaseType.postgre, databaseKey: 'invalid-postgres' })).rejects.toThrow(
      'error.postgresConfig'
    );
    await expect(setupDB({ dbType: 'unsupported' as DatabaseType, databaseKey: 'unsupported' })).rejects.toThrow(
      'error.noDatabase'
    );
  });

  it('surfaces migration messages and permits a later queued setup after failure', async () => {
    const failedDb = makeDb();
    const recoveredDb = makeDb();
    mocks.openSqlLite.mockResolvedValueOnce({ db: failedDb }).mockResolvedValueOnce({ db: recoveredDb });
    mocks.runMigrations
      .mockResolvedValueOnce({ success: false, message: 'migration detail' })
      .mockResolvedValueOnce(undefined);
    const { setupDB } = await import('../database');

    await expect(setupDB({ dbType: DatabaseType.sqlite, databaseKey: 'failed-db' })).rejects.toThrow(
      'migration detail'
    );
    await expect(setupDB({ dbType: DatabaseType.sqlite, databaseKey: 'recovered-db' })).resolves.toBeUndefined();
    expect(failedDb.close).toHaveBeenCalledTimes(1);
  });

  it('uses the default migration error when no message is supplied', async () => {
    mocks.openSqlLite.mockResolvedValue({ db: makeDb() });
    mocks.runMigrations.mockResolvedValue({ success: false });
    const { setupDB } = await import('../database');

    await expect(
      setupDB({ dbType: DatabaseType.sqlite, sqliteConfig: {}, databaseKey: 'migration-error-db' })
    ).rejects.toThrow('error.failedMigration');
  });

  it('keeps database instances isolated by request key', async () => {
    const alphaDb = makeDb();
    const betaDb = makeDb();
    mocks.openSqlLite.mockResolvedValueOnce({ db: alphaDb }).mockResolvedValueOnce({ db: betaDb });
    const { getRequestDatabase, setupDB } = await import('../database');

    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: 'tmp/alpha.db' },
      databaseKey: 'browser-alpha'
    });
    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: 'tmp/beta.db' },
      databaseKey: 'browser-beta'
    });

    expect(getRequestDatabase({ headers: { 'x-database-key': 'browser-alpha' } } as never)).toBe(alphaDb);
    expect(getRequestDatabase({ headers: { 'x-database-key': 'browser-beta' } } as never)).toBe(betaDb);
    expect(getRequestDatabase({ headers: {} } as never)).toBeNull();
  });

  it('does not resolve an unscoped request to a process-wide database', async () => {
    const database = makeDb();
    mocks.openSqlLite.mockResolvedValue({ db: database });
    const { getRequestDatabase, setupDB } = await import('../database');

    await expect(setupDB({ dbType: DatabaseType.sqlite, databaseKey: '' })).rejects.toThrow(
      'error.databaseContextRequired'
    );
    expect(getRequestDatabase({ headers: {} } as never)).toBeNull();
  });

  it('keeps an established session bound to its original database', async () => {
    const alphaDb = makeDb();
    const betaDb = makeDb();
    const alphaSession = await issueSession('workspace-alpha');
    const betaSession = await issueSession('workspace-beta');
    mocks.openSqlLite.mockResolvedValueOnce({ db: alphaDb }).mockResolvedValueOnce({ db: betaDb });
    const { getRequestDatabase, setupDB } = await import('../database');

    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: 'tmp/alpha-session.db' },
      databaseKey: 'database-alpha',
      sessionId: alphaSession.token,
      workspaceId: 'workspace-alpha'
    });
    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: 'tmp/beta-session.db' },
      databaseKey: 'database-beta',
      sessionId: betaSession.token,
      workspaceId: 'workspace-beta'
    });

    expect(
      getRequestDatabase({
        sessionId: alphaSession.token,
        workspaceId: alphaSession.workspaceId,
        headers: { 'x-database-key': 'database-alpha' }
      } as never)
    ).toBe(alphaDb);
    expect(
      getRequestDatabase({
        sessionId: betaSession.token,
        workspaceId: betaSession.workspaceId,
        headers: { 'x-database-key': 'database-beta' }
      } as never)
    ).toBe(betaDb);
  });

  it('rejects a database key that conflicts with the session or workspace owner', async () => {
    const database = makeDb();
    const session = await issueSession('workspace-owned');
    mocks.openSqlLite.mockResolvedValue({ db: database });
    const { getRequestDatabase, setupDB } = await import('../database');

    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: 'tmp/owned.db' },
      databaseKey: 'database-owned',
      sessionId: session.token,
      workspaceId: 'workspace-owned'
    });

    expect(
      getRequestDatabase({
        sessionId: session.token,
        workspaceId: session.workspaceId,
        headers: { 'x-database-key': 'database-other' }
      } as never)
    ).toBeNull();
    expect(
      getRequestDatabase({
        sessionId: session.token,
        workspaceId: session.workspaceId,
        headers: { 'x-database-key': 'database-other' }
      } as never)
    ).toBeNull();
  });

  it('rejects reuse of a database key by another session before replacing its database', async () => {
    const firstDb = makeDb();
    const secondDb = makeDb();
    const firstSession = await issueSession('workspace-first');
    const secondSession = await issueSession('workspace-second');
    mocks.openSqlLite.mockResolvedValueOnce({ db: firstDb }).mockResolvedValueOnce({ db: secondDb });
    const { getRequestDatabase, setupDB } = await import('../database');

    await setupDB({
      dbType: DatabaseType.sqlite,
      sqliteConfig: { fullPath: 'tmp/first-owner.db' },
      databaseKey: 'shared-key',
      sessionId: firstSession.token,
      workspaceId: firstSession.workspaceId
    });

    await expect(
      setupDB({
        dbType: DatabaseType.sqlite,
        sqliteConfig: { fullPath: 'tmp/second-owner.db' },
        databaseKey: 'shared-key',
        sessionId: secondSession.token,
        workspaceId: secondSession.workspaceId
      })
    ).rejects.toThrow('error.databaseAccessDenied');

    expect(firstDb.close).not.toHaveBeenCalled();
    expect(getRequestDatabase({ headers: { 'x-database-key': 'shared-key' } } as never)).toBe(firstDb);
  });
});
