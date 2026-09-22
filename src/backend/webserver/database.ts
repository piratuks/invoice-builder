import type { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { initInitialData, initSchema, openPostgreSql, openSqlLite } from '../shared/db/setup';
import { DatabaseType } from '../shared/enums/databaseType';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';
import type { PostgresConfig } from '../shared/types/postgresConfig';
import type { SqLiteConfig } from '../shared/types/sqliteConfig';
import { runMigrations } from './migration';
import { bindSessionDatabase } from './session';

const requestDbRegistry = new Map<string, DatabaseAdapter>();
const sessionDatabaseRegistry = new Map<string, string>();
const workspaceDatabaseRegistry = new Map<string, string>();
const databaseOwnerRegistry = new Map<string, string>();

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
  if (sessionId && databaseKey) databaseOwnerRegistry.set(databaseKey, sessionId);

  return databaseKey;
};

export const clearSessionDatabase = (sessionId?: string, workspaceId?: string) => {
  if (sessionId) sessionDatabaseRegistry.delete(sessionId);
  if (workspaceId) workspaceDatabaseRegistry.delete(workspaceId);
};

const assertDatabaseOwnership = (databaseKey: string, sessionId?: string) => {
  if (!sessionId) return;
  const ownerSessionId = databaseOwnerRegistry.get(databaseKey);
  if (ownerSessionId && ownerSessionId !== sessionId) {
    throw new Error('error.databaseAccessDenied');
  }
};

export const getDatabaseKeyFromRequest = (req: Request): string | undefined => {
  const sessionId = normalizeDatabaseKey(req.sessionId);
  const workspaceId = normalizeDatabaseKey(req.workspaceId);
  const rawKey = req.headers['x-database-key'] ?? req.headers['x-db-key'] ?? req.headers['database-key'];
  const directKey = normalizeDatabaseKey(Array.isArray(rawKey) ? rawKey[0] : rawKey);
  const sessionDatabaseKey = sessionId ? sessionDatabaseRegistry.get(sessionId) : undefined;
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

export const restoreSqliteDatabase = async (databaseKey: string, fullPath: string) => {
  const resolvedKey = normalizeDatabaseKey(databaseKey);
  const resolvedPath = normalizeDatabaseKey(fullPath);
  if (!resolvedKey || !resolvedPath) throw new Error('error.databaseContextRequired');

  const existing = requestDbRegistry.get(resolvedKey);
  if (existing) return existing;

  const { db } = await openSqlLite({ fullPath: resolvedPath, createIfMissing: false });
  const migrationResult = await runMigrations(db);
  if (migrationResult && !migrationResult.success) {
    await db.close().catch(() => undefined);
    throw new Error(migrationResult.message ?? 'error.failedMigration');
  }
  requestDbRegistry.set(resolvedKey, db);
  return db;
};

export const restorePostgresDatabase = async (databaseKey: string, config: PostgresConfig) => {
  const resolvedKey = normalizeDatabaseKey(databaseKey);
  if (!resolvedKey || !config?.database) throw new Error('error.databaseContextRequired');

  const existing = requestDbRegistry.get(resolvedKey);
  if (existing) return existing;

  const { db } = await openPostgreSql(config);
  const migrationResult = await runMigrations(db);
  if (migrationResult && !migrationResult.success) {
    await db.close().catch(() => undefined);
    throw new Error(migrationResult.message ?? 'error.failedMigration');
  }
  requestDbRegistry.set(resolvedKey, db);
  return db;
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
  assertDatabaseOwnership(resolvedKey, sessionId);
  const previousDb = requestDbRegistry.get(resolvedKey);

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

  try {
    if (createIfMissing) {
      await initSchema(newDb);
      await initInitialData(newDb);
    }

    const migrationResult = await runMigrations(newDb);
    if (migrationResult && !migrationResult.success) {
      throw new Error(migrationResult.message ?? 'error.failedMigration');
    }

    if (sessionId) {
      await bindSessionDatabase(sessionId, resolvedKey, newDb);
    }
    if (previousDb) await previousDb.close();
    requestDbRegistry.set(resolvedKey, newDb);
    registerSessionDatabase({ sessionId, workspaceId, databaseKey: resolvedKey });
  } catch (error) {
    await newDb.close().catch(() => undefined);
    throw error;
  }
};

export const closeInactiveDatabases = async (activeDatabaseKeys: Set<string>) => {
  for (const [databaseKey, db] of requestDbRegistry) {
    if (activeDatabaseKeys.has(databaseKey)) continue;
    requestDbRegistry.delete(databaseKey);
    await db.close().catch(() => undefined);
  }

  for (const [sessionId, databaseKey] of sessionDatabaseRegistry) {
    if (!activeDatabaseKeys.has(databaseKey)) sessionDatabaseRegistry.delete(sessionId);
  }
  for (const [workspaceId, databaseKey] of workspaceDatabaseRegistry) {
    if (!activeDatabaseKeys.has(databaseKey)) workspaceDatabaseRegistry.delete(workspaceId);
  }
  for (const databaseKey of databaseOwnerRegistry.keys()) {
    if (!activeDatabaseKeys.has(databaseKey)) databaseOwnerRegistry.delete(databaseKey);
  }
};

export const closeAllDatabases = async () => {
  await Promise.allSettled([...requestDbRegistry.values()].map(db => db.close()));
  requestDbRegistry.clear();
  sessionDatabaseRegistry.clear();
  workspaceDatabaseRegistry.clear();
  databaseOwnerRegistry.clear();
};

declare module 'express' {
  interface Request {
    db?: DatabaseAdapter | null;
    sessionId?: string;
    workspaceId?: string;
  }
}
