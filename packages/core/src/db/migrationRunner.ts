import fs from 'fs';
import path from 'path';
import { DatabaseType } from '@invoice-builder/contracts';

import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { mapDatabaseError } from '../utils/errorFunctions';

export const runMigrations = async (db: DatabaseAdapter, migrationsPath: string) => {
  let transactionStarted = false;
  try {
    if (!fs.existsSync(migrationsPath)) {
      return;
    }
    const files = fs
      .readdirSync(migrationsPath)
      .filter(f => /^\d{8}-\d{2}-.*\.(cjs|js|ts)$/.test(f))
      .sort();

    if (db.type === DatabaseType.sqlite) {
      await db.run('PRAGMA foreign_keys = OFF;');
    }
    await db.run('BEGIN');
    transactionStarted = true;

    for (const file of files) {
      const name = path.basename(file);

      const row = await db.get(`SELECT 1 FROM migrations WHERE "name" = ?`, [name]);

      if (!row) {
        const migrationPath = path.resolve(migrationsPath, file);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const migration = require(migrationPath);
        if (typeof migration.up !== 'function') {
          throw new Error(`error.noUpFunction`);
        }
        if (migration.up) {
          await migration.up(db);
          await db.run(`INSERT INTO migrations("name") VALUES(?)`, [name]);
        }
      }
    }

    await db.run('COMMIT');

    if (db.type === DatabaseType.sqlite) {
      await db.run('PRAGMA foreign_keys = ON;');
    }
    return { success: true, message: undefined, data: undefined, key: undefined };
  } catch (error) {
    if (transactionStarted) {
      try {
        await db.run('ROLLBACK');
      } catch {
        throw new Error(`error.rollbackFailed`);
      }
    }

    if (db.type === DatabaseType.sqlite) {
      await db.run('PRAGMA foreign_keys = ON;');
    }
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
