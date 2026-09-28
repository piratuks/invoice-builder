import { getBackendConfig } from '../shared/config';
import { runMigrations as runMigrationsShared } from '../shared/db/migrationRunner';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';

const migrationsPath = getBackendConfig().webserver.migrationsPath;

export const runMigrations = async (db: DatabaseAdapter) => {
  return runMigrationsShared(db, migrationsPath);
};
