import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getTableColumns } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const cols = await getTableColumns(db, 'invoices');
    const colInfo = cols.find(c => c.name === 'paidAt');
    if (colInfo) return;

    await db.run(
      `
        ALTER TABLE invoices
        ADD COLUMN "paidAt" ${getColumnType('DATETIME', db.type)}
      `
    );
    await db.run(
      `
        ALTER TABLE invoices
        ADD COLUMN "closedAt" ${getColumnType('DATETIME', db.type)}
      `
    );
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
