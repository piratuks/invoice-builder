import { DatabaseType } from '../../shared/enums/databaseType';
import { up as migrateSessionWorkspaces } from '../../shared/migrations/20260922-31-session-workspaces';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';
import { authenticateSession, bindSessionDatabase, clearSessions, issueSession } from '../session';

const makeMemoryDb = (): DatabaseAdapter => {
  const sessions = new Map<string, Record<string, unknown>>();
  const workspaces = new Map<string, Record<string, unknown>>();
  const run = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('INSERT INTO workspaces')) workspaces.set(String(params[0]), { databaseKey: params[1] });
    if (sql.includes('INSERT INTO sessions')) {
      sessions.set(String(params[0]), {
        token: params[0],
        workspaceId: params[1],
        databaseKey: params[2],
        createdAt: params[3],
        updatedAt: params[4],
        expiresAt: params[5]
      });
    }
    if (sql.includes('DELETE FROM sessions')) sessions.delete(String(params[0]));
    return 1;
  });
  return {
    type: DatabaseType.sqlite,
    run,
    get: async <T>(sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM workspaces')) return (workspaces.get(String(params[0])) ?? null) as T | null;
      return (sessions.get(String(params[0])) ?? null) as T | null;
    },
    all: async () => [],
    query: async () => ({ rows: [] }),
    close: async () => undefined
  };
};

describe('selected database session persistence', () => {
  beforeEach(async () => clearSessions());

  it('creates session tables through the shared migration and persists selected database ownership', async () => {
    const db = makeMemoryDb();
    await migrateSessionWorkspaces(db);
    const session = await issueSession('workspace-a');
    await bindSessionDatabase(session.token, 'database-a', db);

    expect(db.run).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS workspaces'));
    expect(db.run).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS sessions'));
    await expect(authenticateSession(session.token, db)).resolves.toMatchObject({ databaseKey: 'database-a' });
  });

  it('isolates session records between selected database adapters', async () => {
    const alphaDb = makeMemoryDb();
    const betaDb = makeMemoryDb();
    const alpha = await issueSession('workspace-alpha');
    const beta = await issueSession('workspace-beta');
    await bindSessionDatabase(alpha.token, 'database-alpha', alphaDb);
    await bindSessionDatabase(beta.token, 'database-beta', betaDb);

    await expect(authenticateSession(alpha.token, betaDb)).resolves.toBeUndefined();
    await expect(authenticateSession(beta.token, alphaDb)).resolves.toBeUndefined();
    await expect(authenticateSession(alpha.token, alphaDb)).resolves.toMatchObject({ workspaceId: 'workspace-alpha' });
  });
});
