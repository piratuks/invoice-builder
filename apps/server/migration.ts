import { getBackendConfig } from '@invoice-builder/core/config';
import { runMigrations as runMigrationsShared } from '@invoice-builder/core/db/migrationRunner';
import type { DatabaseAdapter } from '@invoice-builder/core/types/DatabaseAdapter';

const migrationsPath = getBackendConfig().webserver.migrationsPath;

export const runMigrations = async (db: DatabaseAdapter) => {
  return runMigrationsShared(db, migrationsPath);
};
