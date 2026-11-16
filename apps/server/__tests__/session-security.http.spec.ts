import { DatabaseType } from '@invoice-builder/contracts';
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { AddressInfo } from 'net';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseAdapter } from '@invoice-builder/core/types/DatabaseAdapter';

const mocks = vi.hoisted(() => ({
  openSqlLite: vi.fn(),
  initSchema: vi.fn(),
  initInitialData: vi.fn(),
  runMigrations: vi.fn(),
  onEditionServerStarted: vi.fn().mockResolvedValue(undefined),
  onEditionServerStopping: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('@invoice-builder/core/db/setup', () => ({
  openSqlLite: mocks.openSqlLite,
  openPostgreSql: vi.fn(),
  initSchema: mocks.initSchema,
  initInitialData: mocks.initInitialData
}));
vi.mock('../migration', () => ({ runMigrations: mocks.runMigrations }));
vi.mock('../edition', () => ({
  registerEditionRoutes: (router: express.Router) =>
    router.get('/probe', (req, res) => {
      const requestWithContext = req as express.Request & {
        sessionId?: string;
        db?: DatabaseAdapter | null;
      };
      res.json({ sessionId: requestWithContext.sessionId, hasDb: Boolean(requestWithContext.db) });
    }),
  onEditionServerStarted: mocks.onEditionServerStarted,
  onEditionServerStopping: mocks.onEditionServerStopping
}));
const makeDb = (name: string) =>
  ({
    name,
    run: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue(null),
    close: vi.fn().mockResolvedValue(undefined)
  }) as unknown as DatabaseAdapter;

const request = async (app: express.Express, headers: Record<string, string>, path = '/protected') => {
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    return await fetch(`http://127.0.0.1:${port}${path}`, { headers });
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
    await clearSessions();
    await closeAllDatabases();
  });

  const createProtectedApp = async () => {
    const { sessionDatabaseMiddleware, databaseContextMiddleware } = await import('../main');
    const { requireDB } = await import('../utils/functions');
    const app = express();
    app.use(
      rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        skipSuccessfulRequests: true,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: undefined, key: 'error.rateLimiter' }
      })
    );
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

  it('rate limits repeated authorization attempts', async () => {
    const app = await createProtectedApp();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await request(app, { 'x-session-token': 'forged-token' })).status).toBe(401);
    }

    const response = await request(app, { 'x-session-token': 'forged-token' });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ key: 'error.rateLimiter' });
  });

  it('rejects unauthorized workspace access', async () => {
    const { issueSession } = await import('../session');
    const session = await issueSession('workspace-a');
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
    const alpha = await issueSession('workspace-alpha');
    const beta = await issueSession('workspace-beta');
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
    const { issueSession } = await import('../session');
    const session = await issueSession('workspace-expired');
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(session.expiresAt) + 1);

    const response = await request(await createProtectedApp(), { 'x-session-token': session.token });

    vi.useRealTimers();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ key: 'error.sessionExpired' });
  });

  it('preserves ownership across refresh requests and refreshes the session TTL', async () => {
    const database = makeDb('owned');
    mocks.openSqlLite.mockResolvedValue({ db: database });
    const { issueSession } = await import('../session');
    const { setupDB } = await import('../database');
    const session = await issueSession('workspace-refresh');
    await setupDB({
      dbType: DatabaseType.sqlite,
      databaseKey: 'database-refresh',
      sessionId: session.token,
      workspaceId: session.workspaceId
    });
    const app = await createProtectedApp();

    const first = await request(app, {
      cookie: `invoice-builder-session=${session.token}`,
      'x-database-key': 'database-refresh'
    });
    const second = await request(app, {
      cookie: `invoice-builder-session=${session.token}`,
      'x-database-key': 'database-refresh'
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({ database: 'owned' });
  });

  it('registers edition routes behind session and database-context middleware', async () => {
    const { createApp } = await import('../main');
    const { issueSession } = await import('../session');
    const { setupDB } = await import('../database');
    const database = makeDb('edition-db');
    mocks.openSqlLite.mockResolvedValue({ db: database });
    const session = await issueSession('workspace-edition');
    await setupDB({
      dbType: DatabaseType.sqlite,
      databaseKey: 'database-edition',
      sessionId: session.token,
      workspaceId: session.workspaceId
    });

    const app = createApp();
    const rejected = await request(app, { 'x-session-token': 'invalid-token' }, '/api/edition/probe');
    expect(rejected.status).toBe(401);

    const response = await request(
      app,
      {
        'x-session-token': session.token,
        'x-database-key': 'database-edition'
      },
      '/api/edition/probe'
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sessionId: session.token, hasDb: true });
  });

  it('awaits lifecycle hooks in order and surfaces startup and shutdown failures', async () => {
    const { startHttpServer, stopHttpServer } = await import('../main');
    const events: string[] = [];
    mocks.onEditionServerStarted.mockImplementation(async () => {
      await Promise.resolve();
      events.push('started');
    });
    const httpServer = await startHttpServer(express(), 0, '127.0.0.1');
    events.push('start-resolved');

    mocks.onEditionServerStopping.mockImplementation(async () => {
      await Promise.resolve();
      events.push('stopping');
    });
    const closeDatabases = vi.fn(async () => {
      events.push('databases-closed');
    });
    await stopHttpServer(httpServer, closeDatabases);
    expect(events).toEqual(['started', 'start-resolved', 'stopping', 'databases-closed']);
    expect(httpServer.listening).toBe(false);

    const startupError = new Error('edition startup failed');
    mocks.onEditionServerStarted.mockRejectedValueOnce(startupError);
    await expect(startHttpServer(express(), 0, '127.0.0.1')).rejects.toBe(startupError);

    const shutdownServer = await startHttpServer(express(), 0, '127.0.0.1');
    const shutdownError = new Error('edition shutdown failed');
    mocks.onEditionServerStopping.mockRejectedValueOnce(shutdownError);
    const closeAfterFailure = vi.fn().mockResolvedValue(undefined);
    await expect(stopHttpServer(shutdownServer, closeAfterFailure)).rejects.toBe(shutdownError);
    expect(closeAfterFailure).toHaveBeenCalledOnce();
    expect(shutdownServer.listening).toBe(false);
  });
});
