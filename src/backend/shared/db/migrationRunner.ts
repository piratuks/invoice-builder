import fs from 'fs';
import path from 'path';
import { DatabaseType } from '../enums/databaseType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getDefaultValue } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const runMigrations = async (db: DatabaseAdapter, migrationsPath: string) => {
  let transactionStarted = false;
  try {
    const files = fs
      .readdirSync(migrationsPath)
      .filter(f => /^\d{8}-\d{2}-.*\.(cjs|js|ts)$/.test(f))
      .sort();

    if (db.type === DatabaseType.sqlite) {
      await db.run('PRAGMA foreign_keys = OFF;');
    }
    await db.run('BEGIN');
    transactionStarted = true;

    await db.run(
      `
      CREATE TABLE IF NOT EXISTS migrations (
        "name" TEXT PRIMARY KEY,
        "appliedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
      );
    `
    );

    for (const file of files) {
      const name = path.basename(file);

      const row = await db.get(`SELECT 1 FROM migrations WHERE "name" = ?`, [name]);

      if (!row) {
        const migrationPath = path.resolve(migrationsPath, file);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const migration = require(migrationPath);
        if (typeof migration.up !== 'function') {
          throw new Error(`Migration ${file} does not export up()`);
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
        throw new Error(`ROLLBACK failed`);
      }
    }

    if (db.type === DatabaseType.sqlite) {
      await db.run('PRAGMA foreign_keys = ON;');
    }
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
