import type { IpcMainInvokeEvent } from 'electron';
import { initInitialData, initSchema, openPostgreSql, openSqlLite } from '../shared/db/setup';
import { DatabaseType } from '../shared/enums/databaseType';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';
import type { PostgresConfig } from '../shared/types/postgresConfig';
import type { SqLiteConfig } from '../shared/types/sqliteConfig';
import { runMigrations } from './migration';

const databases = new Map<number, DatabaseAdapter>();

const requireDatabase = (event: IpcMainInvokeEvent): DatabaseAdapter => {
  const database = databases.get(event.sender.id);
  if (!database) throw new Error('error.databaseNotInitialized');
  return database;
};

const setupDB = async (opts: {
  dbType: DatabaseType;
  createIfMissing?: boolean;
  postgresConfig?: PostgresConfig;
  sqliteConfig?: SqLiteConfig;
  windowId: number;
}) => {
  const { sqliteConfig, createIfMissing = true, windowId, dbType, postgresConfig } = opts;
  const currentDatabase = databases.get(windowId);
  if (currentDatabase) {
    databases.delete(windowId);
    await currentDatabase.close();
  }

  let database: DatabaseAdapter | null = null;

  if (dbType === DatabaseType.postgre) {
    if (!postgresConfig) throw new Error('error.postgresConfig');
    const { db: newDb } = await openPostgreSql(postgresConfig);
    database = newDb;
  } else if (dbType === DatabaseType.sqlite) {
    const { db: newDb } = await openSqlLite({ fullPath: sqliteConfig?.fullPath, createIfMissing: createIfMissing });
    database = newDb;
  }

  if (!database) throw new Error('error.noDatabase');

  if (createIfMissing) {
    await initSchema(database);
    await initInitialData(database);
  }

  const migrationResult = await runMigrations(database);
  if (migrationResult && !migrationResult.success) {
    throw new Error(migrationResult.message ?? 'error.failedMigration');
  }

  databases.set(windowId, database);
};

const cleanupDatabase = async (windowId: number) => {
  const database = databases.get(windowId);
  if (!database) return;
  databases.delete(windowId);
  await database.close();
};

export { cleanupDatabase, databases, requireDatabase, setupDB };
