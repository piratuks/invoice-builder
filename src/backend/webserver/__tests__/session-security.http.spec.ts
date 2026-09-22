import express from 'express';
import type { AddressInfo } from 'net';
import { DatabaseType } from '../../shared/enums/databaseType';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';

const mocks = vi.hoisted(() => ({
  openSqlLite: vi.fn(),
  initSchema: vi.fn(),
  initInitialData: vi.fn(),
  runMigrations: vi.fn()
}));

vi.mock('../../shared/db/setup', () => ({
  openSqlLite: mocks.openSqlLite,
  openPostgreSql: vi.fn(),
  initSchema: mocks.initSchema,
  initInitialData: mocks.initInitialData
}));
vi.mock('../migration', () => ({ runMigrations: mocks.runMigrations }));

const makeDb = (name: string) => ({ name, close: vi.fn().mockResolvedValue(undefined) }) as unknown as DatabaseAdapter;

const request = async (app: express.Express, headers: Record<string, string>) => {
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    return await fetch(`http://127.0.0.1:${port}/protected`, { headers });
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
};

describe('webserver HTTP session security', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.runMigrations.mockResolvedValue({ success: true });
    const { clearSessions } = await import('../session');
    const { closeAllDatabases } = await import('../database');
    clearSessions();
    await closeAllDatabases();
  });

  const createProtectedApp = async () => {
    const { sessionDatabaseMiddleware, databaseContextMiddleware } = await import('../main');
    const { requireDB } = await import('../utils/functions');
    const app = express();
    app.use(sessionDatabaseMiddleware);
    app.use(databaseContextMiddleware);
    app.get('/protected', requireDB, (req, res) => {
      const requestWithDb = req as express.Request & { db?: DatabaseAdapter | null };
      res.json({ success: true, database: (requestWithDb.db as DatabaseAdapter & { name: string }).name });
    });
    return app;
  };

  it('rejects forged session tokens', async () => {
    const response = await request(await createProtectedApp(), { 'x-session-token': 'forged-token' });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ key: 'error.sessionExpired' });
  });

  it('rejects unauthorized workspace access', async () => {
    const { issueSession } = await import('../session');
    const session = issueSession('workspace-a');
    const response = await request(await createProtectedApp(), {
      'x-session-token': session.token,
      'x-workspace-id': 'workspace-b'
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ key: 'error.workspaceAccessDenied' });
  });

  it('does not allow database selection to overwrite another session', async () => {
    const alphaDb = makeDb('alpha');
    const betaDb = makeDb('beta');
    mocks.openSqlLite.mockResolvedValueOnce({ db: alphaDb }).mockResolvedValueOnce({ db: betaDb });
    const { issueSession } = await import('../session');
    const { setupDB } = await import('../database');
    const alpha = issueSession('workspace-alpha');
    const beta = issueSession('workspace-beta');
    await setupDB({
      dbType: DatabaseType.sqlite,
      databaseKey: 'database-alpha',
      sessionId: alpha.token,
      workspaceId: alpha.workspaceId
    });
    await setupDB({
      dbType: DatabaseType.sqlite,
      databaseKey: 'database-beta',
      sessionId: beta.token,
      workspaceId: beta.workspaceId
    });

    const response = await request(await createProtectedApp(), {
      'x-session-token': alpha.token,
      'x-database-key': 'database-beta'
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ key: 'error.databaseAccessDenied' });
  });

  it('rejects expired sessions', async () => {
    const { issueSession, getSessionStore } = await import('../session');
    const session = issueSession('workspace-expired');
    getSessionStore().get(session.token)!.expiresAt = Date.now() - 1;

    const response = await request(await createProtectedApp(), { 'x-session-token': session.token });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ key: 'error.sessionExpired' });
  });

  it('preserves ownership across refresh requests and refreshes the session TTL', async () => {
    const database = makeDb('owned');
    mocks.openSqlLite.mockResolvedValue({ db: database });
    const { issueSession } = await import('../session');
    const { setupDB } = await import('../database');
    const session = issueSession('workspace-refresh');
    await setupDB({
      dbType: DatabaseType.sqlite,
      databaseKey: 'database-refresh',
      sessionId: session.token,
      workspaceId: session.workspaceId
    });
    const app = await createProtectedApp();

    const first = await request(app, {
      'x-session-token': session.token,
      'x-database-key': 'database-refresh'
    });
    const second = await request(app, {
      'x-session-token': session.token,
      'x-database-key': 'database-refresh'
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({ database: 'owned' });
  });
});
