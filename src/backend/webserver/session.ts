import { randomBytes, randomUUID } from 'crypto';
import type { Request } from 'express';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';

export type WebSession = {
  token: string;
  workspaceId: string;
  databaseKey?: string;
  createdAt: string;
  expiresAt: string;
  lastAccessAt: string;
};

type StoredSession = WebSession & {
  createdAt: string | number;
  updatedAt: string | number;
  expiresAt: string | number;
};

const sessions = new Map<string, { session: WebSession; databaseKey?: string; db?: DatabaseAdapter }>();

const sessionTtlMs = Number(process.env.WEBSERVER_SESSION_TTL_MS) || 30 * 60 * 1000;
export const sessionCookieName = 'invoice-builder-session';
export const issueSession = async (workspaceId?: string): Promise<WebSession> => {
  const now = new Date().toISOString();
  const session: WebSession = {
    token: randomBytes(32).toString('hex'),
    workspaceId: workspaceId?.trim() || `workspace-${randomUUID()}`,
    createdAt: now,
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
    lastAccessAt: now
  };
  sessions.set(session.token, { session });
  return session;
};

const toIsoDate = (value: string | number) =>
  typeof value === 'number' ? new Date(value).toISOString() : new Date(value).toISOString();

const rowToSession = (row: StoredSession): WebSession => ({
  token: row.token,
  workspaceId: row.workspaceId,
  databaseKey: row.databaseKey,
  createdAt: toIsoDate(row.createdAt),
  expiresAt: toIsoDate(row.expiresAt),
  lastAccessAt: toIsoDate(row.updatedAt)
});

const persistSession = async (session: WebSession, db: DatabaseAdapter, updatedAt = new Date().toISOString()) => {
  await db.run(
    'INSERT INTO workspaces (workspaceId, databaseKey, createdAt, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(workspaceId) DO UPDATE SET databaseKey = excluded.databaseKey, updatedAt = excluded.updatedAt',
    [session.workspaceId, session.databaseKey ?? null, session.createdAt, updatedAt]
  );
  await db.run(
    'INSERT INTO sessions (token, workspaceId, databaseKey, createdAt, updatedAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(token) DO UPDATE SET databaseKey = excluded.databaseKey, updatedAt = excluded.updatedAt, expiresAt = excluded.expiresAt',
    [session.token, session.workspaceId, session.databaseKey ?? null, session.createdAt, updatedAt, session.expiresAt]
  );
};

const deleteSession = async (token: string, db?: DatabaseAdapter) => {
  if (db) await db.run('DELETE FROM sessions WHERE token = ?', [token]);
  sessions.delete(token);
};

export const getSession = async (token?: string, db?: DatabaseAdapter): Promise<WebSession | undefined> => {
  if (!token) return undefined;
  const context = sessions.get(token);
  if (context?.databaseKey && db && context.databaseKey !== findDatabaseKey(db)) return undefined;
  let session = context?.session;
  if (!session && db) {
    const row = await db.get<StoredSession>('SELECT * FROM sessions WHERE token = ?', [token]);
    if (row) {
      session = rowToSession(row);
      sessions.set(token, { session, databaseKey: session.databaseKey, db });
    }
  }
  if (!session || Date.parse(session.expiresAt) <= Date.now()) {
    if (session) await deleteSession(token, context?.db ?? db);
    return undefined;
  }
  return { ...session };
};

const findDatabaseKey = (db: DatabaseAdapter) => [...sessions.values()].find(context => context.db === db)?.databaseKey;

export const authenticateSession = async (token?: string, db?: DatabaseAdapter): Promise<WebSession | undefined> => {
  const session = await getSession(token, db);
  if (!session) return undefined;
  const now = new Date().toISOString();
  session.lastAccessAt = now;
  session.expiresAt = new Date(Date.now() + sessionTtlMs).toISOString();
  const context = sessions.get(session.token);
  if (context) {
    context.session = session;
    if (context.db) await persistSession(session, context.db, now);
  }
  return session;
};

export const bindSessionDatabase = async (token: string, databaseKey: string, db: DatabaseAdapter) => {
  const session = await getSession(token);
  if (!session) throw new Error('error.sessionExpired');
  const existing = sessions.get(token);
  const workspace = await db.get<{ databaseKey: string | null }>(
    'SELECT databaseKey FROM workspaces WHERE workspaceId = ?',
    [session.workspaceId]
  );
  const existingDatabaseKey = existing?.databaseKey ?? workspace?.databaseKey;
  if (existingDatabaseKey && existingDatabaseKey !== databaseKey) {
    throw new Error('error.workspaceDatabaseConflict');
  }
  session.databaseKey = databaseKey;
  await persistSession(session, db, new Date().toISOString());
  sessions.set(token, { session, databaseKey, db });
  return session;
};

export const getSessionTokenFromRequest = (req: Request) => {
  const raw = req.headers['x-session-token'];
  if (raw) return Array.isArray(raw) ? raw[0] : raw;

  const cookies = req.headers.cookie?.split(';') ?? [];
  const sessionCookie = cookies.find(cookie => cookie.trim().startsWith(`${sessionCookieName}=`));
  return sessionCookie ? decodeURIComponent(sessionCookie.trim().slice(sessionCookieName.length + 1)) : undefined;
};

export const expireSessions = async () => {
  const now = new Date().toISOString();
  const databases = [...new Set([...sessions.values()].map(context => context.db).filter(Boolean))];
  await Promise.all(
    databases.map(async db => {
      await db!.run('DELETE FROM sessions WHERE expiresAt <= ?', [now]);
      await db!.run('DELETE FROM workspaces WHERE workspaceId NOT IN (SELECT DISTINCT workspaceId FROM sessions)');
    })
  );
  for (const [token, context] of sessions) {
    if (Date.parse(context.session.expiresAt) <= Date.now()) sessions.delete(token);
  }
};

export const getActiveDatabaseKeys = () =>
  new Set([...sessions.values()].map(context => context.databaseKey).filter((key): key is string => Boolean(key)));

export const clearSessions = async () => {
  await Promise.all(
    [...new Set([...sessions.values()].map(context => context.db).filter(Boolean))].map(db =>
      db!.run('DELETE FROM sessions')
    )
  );
  sessions.clear();
};
export const revokeSession = async (token: string) => {
  const session = await getSession(token);
  if (session) await deleteSession(token, sessions.get(token)?.db);
};
