import type { ItemAdd } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';

export const getOrCreateByName = async (
  db: DatabaseAdapter,
  table: 'units' | 'categories',
  name: string
): Promise<number | undefined> => {
  const row = await db.get(`SELECT "id" FROM ${table} WHERE "name" = ? LIMIT 1`, [name]);
  if (row?.id) return row.id as number;

  await db.run(`INSERT INTO ${table} ("name") VALUES (?)`, [name]);

  const newRow = await db.get(`SELECT id FROM ${table} WHERE "name" = ? LIMIT 1`, [name]);
  if (newRow?.id) return newRow.id as number;

  return undefined;
};

export const resolveItemRelations = async <T extends ItemAdd>(db: DatabaseAdapter, data: T): Promise<T> => {
  const item = { ...data };

  if (typeof item.categoryId === 'undefined' && item.categoryName) {
    item.categoryId = await getOrCreateByName(db, 'categories', item.categoryName);
  }
  if (typeof item.unitId === 'undefined' && item.unitName) {
    item.unitId = await getOrCreateByName(db, 'units', item.unitName);
  }

  return item;
};
