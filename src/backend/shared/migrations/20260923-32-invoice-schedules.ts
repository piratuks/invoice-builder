import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getDefaultValue } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS invoice_schedules (
        "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
        "sourceInvoiceId" INTEGER NOT NULL,
        "cadence" TEXT NOT NULL CHECK ("cadence" IN ('weekly','monthly','quarterly','yearly')),
        "intervalCount" INTEGER NOT NULL DEFAULT 1 CHECK ("intervalCount" > 0),
        "timezone" TEXT NOT NULL DEFAULT 'UTC',
        "startAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
        "endAt" ${getColumnType('DATETIME', db.type)},
        "maxOccurrences" INTEGER CHECK ("maxOccurrences" IS NULL OR "maxOccurrences" > 0),
        "nextRunAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
        "lastRunAt" ${getColumnType('DATETIME', db.type)},
        "dueDateOffsetDays" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active','paused','completed','failed','archived')),
        "deliveryMethod" TEXT NOT NULL DEFAULT 'none' CHECK ("deliveryMethod" IN ('none','email')),
        "failureReason" TEXT,
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        CHECK ("endAt" IS NULL OR "endAt" >= "startAt"),
        FOREIGN KEY ("sourceInvoiceId") REFERENCES invoices("id")
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS invoice_schedule_runs (
        "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
        "scheduleId" INTEGER NOT NULL,
        "dueAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
        "idempotencyKey" TEXT NOT NULL UNIQUE,
        "startedAt" ${getColumnType('DATETIME', db.type)},
        "completedAt" ${getColumnType('DATETIME', db.type)},
        "generatedInvoiceId" INTEGER,
        "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending','running','success','failed','skipped')),
        "deliveryStatus" TEXT NOT NULL DEFAULT 'not_applicable' CHECK ("deliveryStatus" IN ('not_applicable','pending','sent','failed')),
        "deliveryError" TEXT,
        "errorMessage" TEXT,
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        UNIQUE ("scheduleId", "dueAt"),
        FOREIGN KEY ("scheduleId") REFERENCES invoice_schedules("id") ON DELETE CASCADE,
        FOREIGN KEY ("generatedInvoiceId") REFERENCES invoices("id") ON DELETE SET NULL
      )
    `);

    await db.run(
      'CREATE INDEX IF NOT EXISTS idx_invoice_schedules_status_nextRunAt ON invoice_schedules("status", "nextRunAt")'
    );
    await db.run(
      'CREATE INDEX IF NOT EXISTS idx_invoice_schedules_sourceInvoiceId ON invoice_schedules("sourceInvoiceId")'
    );
    await db.run(
      'CREATE INDEX IF NOT EXISTS idx_invoice_schedule_runs_scheduleId ON invoice_schedule_runs("scheduleId")'
    );
    await db.run('CREATE INDEX IF NOT EXISTS idx_invoice_schedule_runs_dueAt ON invoice_schedule_runs("dueAt")');
    await db.run(
      'CREATE INDEX IF NOT EXISTS idx_invoice_schedule_runs_generatedInvoiceId ON invoice_schedule_runs("generatedInvoiceId")'
    );
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
