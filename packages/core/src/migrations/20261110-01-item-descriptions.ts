import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getTableColumns } from '../utils/dbHelper';

export const up = async (db: DatabaseAdapter): Promise<void> => {
  const snapshotColumns = await getTableColumns(db, 'invoice_item_snapshots');

  if (!snapshotColumns.some(column => column.name === 'itemDescription')) {
    await db.run('ALTER TABLE invoice_item_snapshots ADD COLUMN "itemDescription" TEXT');
  }

  for (const table of ['invoice_customizations', 'style_profiles']) {
    const columns = await getTableColumns(db, table);

    if (!columns.some(column => column.name === 'showItemDescriptions')) {
      await db.run(
        `ALTER TABLE ${table}
         ADD COLUMN "showItemDescriptions" INTEGER NOT NULL DEFAULT 0
         CHECK ("showItemDescriptions" IN (0,1))`
      );
    }
  }
};
