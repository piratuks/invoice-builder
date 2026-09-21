import path from 'path';
import sqlite3 from 'sqlite3';
import { createSqliteAdapter } from '../shared/db/client';
import { runMigrations } from '../shared/db/migrationRunner';
import { initInitialData, initSchema } from '../shared/db/setup';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';

export const createTestDatabase = async (): Promise<DatabaseAdapter> => {
  const sqlite = new sqlite3.Database(':memory:');
  const db = createSqliteAdapter(sqlite);
  await initSchema(db);
  await runMigrations(db, path.resolve(__dirname, '../../../dist-be/backend/migrations'));
  await initInitialData(db);
  return db;
};
