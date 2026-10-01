import { runMigrations as runMigrationsShared } from '@invoice-builder/core/db/migrationRunner';
import type { DatabaseAdapter } from '@invoice-builder/core/types/DatabaseAdapter';
import { app } from 'electron';
import { join, resolve } from 'path';

const isDev = !app.isPackaged;
const migrationsPath = isDev ? join(resolve(), 'dist-migrations') : join(app.getAppPath(), 'dist-migrations');

export const runMigrations = async (db: DatabaseAdapter) => {
  return runMigrationsShared(db, migrationsPath);
};
