import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import { createSqliteAdapter } from '../client';
import { runMigrations } from '../migrationRunner';

const makeTempMigrationsDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-test-'));

const writeMigration = (dir: string, filename: string, contents: string) => {
  fs.writeFileSync(path.join(dir, filename), contents);
};

describe('runMigrations', () => {
  let db: DatabaseAdapter;
  let migrationsDir: string;

  beforeEach(() => {
    db = createSqliteAdapter(new sqlite3.Database(':memory:'));
    migrationsDir = makeTempMigrationsDir();
  });

  afterEach(async () => {
    await db.close();
    fs.rmSync(migrationsDir, { recursive: true, force: true });
  });

  it('does nothing when the migrations path does not exist', async () => {
    const result = await runMigrations(db, path.join(migrationsDir, 'does-not-exist'));
    expect(result).toBeUndefined();
  });

  it('ignores files that do not match the migration filename pattern', async () => {
    writeMigration(migrationsDir, 'not-a-migration.cjs', `module.exports.up = async () => {};`);
    const result = await runMigrations(db, migrationsDir);
    expect(result).toEqual({ success: true, message: undefined, data: undefined, key: undefined });

    const applied = await db.all(`SELECT "name" FROM migrations`);
    expect(applied).toHaveLength(0);
  });

  it('applies matching migrations in order and records them as applied', async () => {
    writeMigration(
      migrationsDir,
      '20260101-01-create-widgets.cjs',
      `module.exports.up = async (db) => { await db.run('CREATE TABLE widgets ("id" INTEGER PRIMARY KEY)'); };`
    );
    const result = await runMigrations(db, migrationsDir);
    expect(result?.success).toBe(true);

    const applied = await db.all<{ name: string }>(`SELECT "name" FROM migrations`);
    expect(applied.map(r => r.name)).toEqual(['20260101-01-create-widgets.cjs']);

    const tables = await db.all<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'widgets'`
    );
    expect(tables).toHaveLength(1);
  });

  it('does not re-apply a migration that has already been recorded', async () => {
    writeMigration(
      migrationsDir,
      '20260101-01-create-widgets.cjs',
      `let calls = 0; module.exports.up = async (db) => { calls++; await db.run('CREATE TABLE widgets ("id" INTEGER PRIMARY KEY)'); globalThis.__widgetCalls = calls; };`
    );
    await runMigrations(db, migrationsDir);
    await runMigrations(db, migrationsDir);

    const applied = await db.all(`SELECT "name" FROM migrations`);
    expect(applied).toHaveLength(1);
  });

  it('throws when a migration module has no up function', async () => {
    writeMigration(migrationsDir, '20260101-01-broken.cjs', `module.exports = {};`);
    const result = await runMigrations(db, migrationsDir);
    expect(result?.success).toBe(false);
  });

  it('rolls back and reports failure when a migration throws', async () => {
    writeMigration(
      migrationsDir,
      '20260101-01-failing.cjs',
      `module.exports.up = async () => { throw new Error('boom'); };`
    );
    const result = await runMigrations(db, migrationsDir);
    expect(result?.success).toBe(false);

    const applied = await db.all(`SELECT "name" FROM migrations`).catch(() => []);
    expect(applied).toHaveLength(0);
  });
});
