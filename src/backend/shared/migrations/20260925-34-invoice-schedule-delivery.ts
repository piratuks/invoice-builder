import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getDefaultValue, getTableColumns } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const cols = await getTableColumns(db, 'settings');

    if (!cols.some(c => c.name === 'deliveryProvider')) {
      await db.run(
        'ALTER TABLE settings ADD COLUMN "deliveryProvider" TEXT NOT NULL DEFAULT \'smtp\' CHECK ("deliveryProvider" IN (\'smtp\'))'
      );
    }
    if (!cols.some(c => c.name === 'smtpHost')) await db.run('ALTER TABLE settings ADD COLUMN "smtpHost" TEXT');
    if (!cols.some(c => c.name === 'smtpPort')) await db.run('ALTER TABLE settings ADD COLUMN "smtpPort" INTEGER');
    if (!cols.some(c => c.name === 'smtpSecure')) {
      await db.run(
        'ALTER TABLE settings ADD COLUMN "smtpSecure" INTEGER NOT NULL DEFAULT 1 CHECK ("smtpSecure" IN (0,1))'
      );
    }
    if (!cols.some(c => c.name === 'smtpUser')) await db.run('ALTER TABLE settings ADD COLUMN "smtpUser" TEXT');
    if (!cols.some(c => c.name === 'smtpFromEmail')) {
      await db.run('ALTER TABLE settings ADD COLUMN "smtpFromEmail" TEXT');
    }
    if (!cols.some(c => c.name === 'smtpFromName')) {
      await db.run('ALTER TABLE settings ADD COLUMN "smtpFromName" TEXT');
    }

    await db.run(`
      CREATE TABLE IF NOT EXISTS invoice_schedule_delivery_attempts (
        "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
        "scheduleRunId" INTEGER NOT NULL,
        "scheduleId" INTEGER NOT NULL,
        "generatedInvoiceId" INTEGER,
        "provider" TEXT NOT NULL DEFAULT 'smtp',
        "recipient" TEXT,
        "status" TEXT NOT NULL CHECK ("status" IN ('pending','sent','failed')),
        "errorMessage" TEXT,
        "attemptedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        FOREIGN KEY ("scheduleRunId") REFERENCES invoice_schedule_runs("id") ON DELETE CASCADE,
        FOREIGN KEY ("scheduleId") REFERENCES invoice_schedules("id") ON DELETE CASCADE,
        FOREIGN KEY ("generatedInvoiceId") REFERENCES invoices("id") ON DELETE SET NULL
      )
    `);

    await db.run(
      'CREATE INDEX IF NOT EXISTS idx_invoice_schedule_delivery_attempts_runId ON invoice_schedule_delivery_attempts("scheduleRunId")'
    );
    await db.run(
      'CREATE INDEX IF NOT EXISTS idx_invoice_schedule_delivery_attempts_scheduleId ON invoice_schedule_delivery_attempts("scheduleId")'
    );
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
