import path from 'path';
import sqlite3 from 'sqlite3';
import { createSqliteAdapter } from '../../db/client';
import { runMigrations } from '../../db/migrationRunner';
import { initInitialData, initSchema } from '../../db/setup';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';

export const createTestDatabase = async (): Promise<DatabaseAdapter> => {
  const sqlite = new sqlite3.Database(':memory:');
  const db = createSqliteAdapter(sqlite);
  await initSchema(db);
  await runMigrations(db, path.resolve(__dirname, '../../../../../dist-be/backend/migrations'));
  await initInitialData(db);
  return db;
};
