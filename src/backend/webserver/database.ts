import type { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { initInitialData, initSchema, openPostgreSql, openSqlLite } from '../shared/db/setup';
import { DatabaseType } from '../shared/enums/databaseType';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';
import type { PostgresConfig } from '../shared/types/postgresConfig';
import type { SqLiteConfig } from '../shared/types/sqliteConfig';
import { runMigrations } from './migration';
import { bindSessionDatabase, getSession } from './session';

const requestDbRegistry = new Map<string, DatabaseAdapter>();
const sessionDatabaseRegistry = new Map<string, string>();
const workspaceDatabaseRegistry = new Map<string, string>();

export type SessionDatabaseContext = {
  sessionId?: string;
  workspaceId?: string;
  databaseKey?: string;
};

export const normalizeDatabaseKey = (value?: string | null): string | undefined => {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw ? raw : undefined;
};

export const registerSessionDatabase = (context: SessionDatabaseContext) => {
  const databaseKey = normalizeDatabaseKey(context.databaseKey);
  const sessionId = normalizeDatabaseKey(context.sessionId);
  const workspaceId = normalizeDatabaseKey(context.workspaceId);

  if (sessionId && databaseKey && !sessionDatabaseRegistry.has(sessionId)) {
    sessionDatabaseRegistry.set(sessionId, databaseKey);
  }
  if (workspaceId && databaseKey && !workspaceDatabaseRegistry.has(workspaceId)) {
    workspaceDatabaseRegistry.set(workspaceId, databaseKey);
  }

  return databaseKey;
};

export const clearSessionDatabase = (sessionId?: string, workspaceId?: string) => {
  if (sessionId) sessionDatabaseRegistry.delete(sessionId);
  if (workspaceId) workspaceDatabaseRegistry.delete(workspaceId);
};

export const getDatabaseKeyFromRequest = (req: Request): string | undefined => {
  const sessionId = normalizeDatabaseKey(req.sessionId);
  const workspaceId = normalizeDatabaseKey(req.workspaceId);
  const rawKey = req.headers['x-database-key'] ?? req.headers['x-db-key'] ?? req.headers['database-key'];
  const directKey = normalizeDatabaseKey(Array.isArray(rawKey) ? rawKey[0] : rawKey);
  const session = sessionId ? getSession(sessionId) : undefined;
  const sessionDatabaseKey = session?.databaseKey ?? (sessionId ? sessionDatabaseRegistry.get(sessionId) : undefined);
  const workspaceDatabaseKey = workspaceId ? workspaceDatabaseRegistry.get(workspaceId) : undefined;

  if (sessionDatabaseKey && directKey && sessionDatabaseKey !== directKey) return undefined;
  if (workspaceDatabaseKey && directKey && workspaceDatabaseKey !== directKey) return undefined;
  if (sessionDatabaseKey) return sessionDatabaseKey;
  if (workspaceDatabaseKey) return workspaceDatabaseKey;
  return directKey;
};

export const getRequestDatabase = (req: Request): DatabaseAdapter | null => {
  const databaseKey = getDatabaseKeyFromRequest(req);
  if (databaseKey) return requestDbRegistry.get(databaseKey) ?? null;
  return null;
};

// Serializes setupDB calls so concurrent requests never overlap while replacing a
// database context during initialization.
let dbSetupQueue: Promise<unknown> = Promise.resolve();

export const setupDB = (opts: {
  dbType: DatabaseType;
  createIfMissing?: boolean;
  postgresConfig?: PostgresConfig;
  sqliteConfig?: SqLiteConfig;
  databaseKey: string;
  sessionId?: string;
  workspaceId?: string;
}): Promise<void> => {
  const task = dbSetupQueue.then(() => performSetup(opts));
  // Swallow the error here so a failed setup doesn't block the next queued call;
  // the error is still propagated to the original caller via the returned `task`.
  dbSetupQueue = task.catch(() => undefined);
  return task;
};

const performSetup = async (opts: {
  dbType: DatabaseType;
  createIfMissing?: boolean;
  postgresConfig?: PostgresConfig;
  sqliteConfig?: SqLiteConfig;
  databaseKey: string;
  sessionId?: string;
  workspaceId?: string;
}): Promise<void> => {
  const { sqliteConfig, createIfMissing = true, dbType, postgresConfig, databaseKey, sessionId, workspaceId } = opts;
  const resolvedKey = normalizeDatabaseKey(databaseKey);
  if (!resolvedKey) throw new Error('error.databaseContextRequired');
  registerSessionDatabase({ sessionId, workspaceId, databaseKey: resolvedKey });
  const previousDb = requestDbRegistry.get(resolvedKey);

  if (previousDb) {
    await previousDb.close();
    if (resolvedKey) {
      requestDbRegistry.delete(resolvedKey);
    }
  }

  let newDb: DatabaseAdapter | null = null;

  if (dbType === DatabaseType.postgre) {
    if (!postgresConfig) throw new Error('error.postgresConfig');
    const { db } = await openPostgreSql(postgresConfig);
    newDb = db;
  } else if (dbType === DatabaseType.sqlite) {
    if (sqliteConfig?.fullPath) fs.mkdirSync(path.dirname(sqliteConfig?.fullPath), { recursive: true });
    const { db } = await openSqlLite({ fullPath: sqliteConfig?.fullPath, createIfMissing: createIfMissing });
    newDb = db;
  }

  if (!newDb) throw new Error('error.noDatabase');

  if (resolvedKey) {
    requestDbRegistry.set(resolvedKey, newDb);
    if (sessionId) {
      bindSessionDatabase(sessionId, resolvedKey);
      sessionDatabaseRegistry.set(sessionId, resolvedKey);
    }
    if (workspaceId) workspaceDatabaseRegistry.set(workspaceId, resolvedKey);
  }

  if (createIfMissing) {
    await initSchema(newDb);
    await initInitialData(newDb);
  }

  const migrationResult = await runMigrations(newDb);
  if (migrationResult && !migrationResult.success) {
    throw new Error(migrationResult.message ?? 'error.failedMigration');
  }
};

export const closeAllDatabases = async () => {
  await Promise.allSettled([...requestDbRegistry.values()].map(db => db.close()));
  requestDbRegistry.clear();
  sessionDatabaseRegistry.clear();
  workspaceDatabaseRegistry.clear();
};

declare module 'express' {
  interface Request {
    db?: DatabaseAdapter | null;
    sessionId?: string;
    workspaceId?: string;
  }
}
