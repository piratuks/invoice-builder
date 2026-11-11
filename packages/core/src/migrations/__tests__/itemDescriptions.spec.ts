import path from 'node:path';
import sqlite3 from 'sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSqliteAdapter } from '../../db/client';
import { runMigrations } from '../../db/migrationRunner';
import { initSchema } from '../../db/setup';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import { getTableColumns } from '../../utils/dbHelper';
import { up } from '../20261110-01-item-descriptions';

describe('item descriptions migration', () => {
  let db: DatabaseAdapter;

  beforeEach(() => {
    db = createSqliteAdapter(new sqlite3.Database(':memory:'));
  });

  afterEach(async () => {
    await db.close();
  });

  const createLegacyTables = async () => {
    await db.run('CREATE TABLE migrations ("name" TEXT PRIMARY KEY)');
    await db.run('CREATE TABLE invoice_item_snapshots ("id" INTEGER PRIMARY KEY, "itemName" TEXT)');
    await db.run('CREATE TABLE invoice_customizations ("id" INTEGER PRIMARY KEY)');
    await db.run('CREATE TABLE style_profiles ("id" INTEGER PRIMARY KEY, "name" TEXT)');

    await db.run('INSERT INTO invoice_item_snapshots ("id", "itemName") VALUES (1, ?)', ['Existing service']);
    await db.run('INSERT INTO invoice_customizations ("id") VALUES (1)');
    await db.run('INSERT INTO style_profiles ("id", "name") VALUES (1, ?)', ['Existing profile']);
  };

  it('upgrades existing records through the compiled migration runner', async () => {
    await createLegacyTables();

    const migrationsPath = path.resolve(process.cwd(), 'dist-migrations');
    const result = await runMigrations(db, migrationsPath);

    expect(result?.success).toBe(true);

    expect(await db.get('SELECT "itemName", "itemDescription" FROM invoice_item_snapshots WHERE "id" = 1')).toEqual({
      itemName: 'Existing service',
      itemDescription: null
    });

    expect(await db.get('SELECT "name", "showItemDescriptions" AS enabled FROM style_profiles WHERE "id" = 1')).toEqual(
      {
        name: 'Existing profile',
        enabled: 0
      }
    );

    expect(await db.get('SELECT "showItemDescriptions" AS enabled FROM invoice_customizations WHERE "id" = 1')).toEqual(
      { enabled: 0 }
    );

    expect(
      await db.get('SELECT "name" FROM migrations WHERE "name" = ?', ['20261110-01-item-descriptions.cjs'])
    ).not.toBeNull();

    const secondRun = await runMigrations(db, migrationsPath);
    expect(secondRun?.success).toBe(true);
  });

  it('preserves existing values when some columns are already present', async () => {
    await createLegacyTables();

    await db.run('ALTER TABLE style_profiles ADD COLUMN "showItemDescriptions" INTEGER NOT NULL DEFAULT 0');
    await db.run('UPDATE style_profiles SET "showItemDescriptions" = 1 WHERE "id" = 1');

    await up(db);

    await db.run('UPDATE invoice_item_snapshots SET "itemDescription" = ? WHERE "id" = 1', ['Saved description']);

    await up(db);

    expect(await db.get('SELECT "showItemDescriptions" AS enabled FROM style_profiles WHERE "id" = 1')).toEqual({
      enabled: 1
    });

    expect(await db.get('SELECT "itemDescription" FROM invoice_item_snapshots WHERE "id" = 1')).toEqual({
      itemDescription: 'Saved description'
    });
  });

  it('also succeeds on a fresh database with the new schema', async () => {
    await initSchema(db);
    await up(db);

    for (const table of ['style_profiles', 'invoice_customizations']) {
      const columns = await getTableColumns(db, table);

      expect(columns.filter(column => column.name === 'showItemDescriptions')).toHaveLength(1);
    }

    const columns = await getTableColumns(db, 'invoice_item_snapshots');

    expect(columns.filter(column => column.name === 'itemDescription')).toHaveLength(1);
  });
});
