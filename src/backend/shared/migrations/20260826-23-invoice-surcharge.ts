import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getTableColumns } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const cols = await getTableColumns(db, 'invoices');
    const colInfo = cols.find(c => c.name === 'surchargeName');
    if (colInfo) return;

    await db.run(
      `
        ALTER TABLE invoices
        ADD COLUMN "surchargeName" TEXT
      `
    );
    await db.run(
      `
        ALTER TABLE invoices
        ADD COLUMN "surchargeAmountCents" TEXT NOT NULL DEFAULT '0';
      `
    );
    await db.run(
      `
        ALTER TABLE invoices
        ADD COLUMN "surchargeType" TEXT CHECK("surchargeType" IN ('fixed','percentage') OR "surchargeType" IS NULL)
      `
    );
    await db.run(
      `
        ALTER TABLE invoices
        ADD COLUMN "surchargePercent" REAL NOT NULL DEFAULT 0
      `
    );
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
