import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getDefaultValue, isTableExists } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const isExisting = await isTableExists(db, 'layouts');
    if (isExisting) return;

    await db.run(`CREATE TABLE IF NOT EXISTS layouts (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "schema" TEXT NOT NULL,  
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS invoice_layout_snapshots (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,
      "layoutSchema" TEXT NOT NULL, 
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      UNIQUE("parentInvoiceId"),
      FOREIGN KEY("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    )`);

    await db.run('CREATE INDEX IF NOT EXISTS idx_layouts_id ON layouts("id")');

    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_layout_snapshots_parentInvoiceId ON invoice_layout_snapshots("parentInvoiceId")`
    );

    await db.run('ALTER TABLE invoices ADD COLUMN "layoutId" INTEGER REFERENCES layouts("id")');

    await db.run('CREATE INDEX IF NOT EXISTS idx_invoices_layoutId ON invoices("layoutId")');
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
