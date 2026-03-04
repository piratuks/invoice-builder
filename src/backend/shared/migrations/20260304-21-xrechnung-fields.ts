import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getTableColumns } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const cols = await getTableColumns(db, 'settings');
    const colInfo = cols.find(c => c.name === 'xrechnungON');
    if (colInfo) return;

    await db.run(
      `
        ALTER TABLE settings
        ADD COLUMN "xrechnungON" INTEGER NOT NULL DEFAULT 1 CHECK ("xrechnungON" IN (0,1))
      `
    );
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
