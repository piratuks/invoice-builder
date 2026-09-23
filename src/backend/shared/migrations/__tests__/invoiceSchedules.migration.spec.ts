import sqlite3 from 'sqlite3';
import { createSqliteAdapter } from '../../db/client';
import { initSchema } from '../../db/setup';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import { getTableColumns, isTableExists } from '../../utils/dbHelper';
import { up as invoiceSchedules } from '../20260923-32-invoice-schedules';

describe('invoice schedules migration', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = createSqliteAdapter(new sqlite3.Database(':memory:'));
    await initSchema(db);
    await invoiceSchedules(db);
  });

  afterEach(async () => {
    await db.close();
  });

  it('creates schedule and run tables with the fields needed for recurring invoice processing', async () => {
    expect(await isTableExists(db, 'invoice_schedules')).toBe(true);
    expect(await isTableExists(db, 'invoice_schedule_runs')).toBe(true);

    const scheduleColumns = (await getTableColumns(db, 'invoice_schedules')).map(column => column.name);
    expect(scheduleColumns).toEqual(
      expect.arrayContaining([
        'sourceInvoiceId',
        'cadence',
        'intervalCount',
        'timezone',
        'startAt',
        'endAt',
        'maxOccurrences',
        'nextRunAt',
        'lastRunAt',
        'dueDateOffsetDays',
        'status',
        'deliveryMethod',
        'failureReason'
      ])
    );

    const runColumns = (await getTableColumns(db, 'invoice_schedule_runs')).map(column => column.name);
    expect(runColumns).toEqual(
      expect.arrayContaining([
        'scheduleId',
        'dueAt',
        'idempotencyKey',
        'startedAt',
        'completedAt',
        'generatedInvoiceId',
        'status',
        'deliveryStatus',
        'deliveryError',
        'errorMessage'
      ])
    );
  });

  it('prevents duplicate schedule runs for the same due occurrence', async () => {
    await db.run(`PRAGMA foreign_keys = OFF`);

    const scheduleId = await db.run(
      `INSERT INTO invoice_schedules (
        "sourceInvoiceId", "cadence", "startAt", "nextRunAt", "status", "deliveryMethod"
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'monthly', '2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z', 'active', 'none'],
      true
    );

    await db.run(`INSERT INTO invoice_schedule_runs ("scheduleId", "dueAt", "idempotencyKey") VALUES (?, ?, ?)`, [
      scheduleId,
      '2026-10-01T00:00:00.000Z',
      'schedule-1-2026-10-01'
    ]);

    await expect(
      db.run(`INSERT INTO invoice_schedule_runs ("scheduleId", "dueAt", "idempotencyKey") VALUES (?, ?, ?)`, [
        scheduleId,
        '2026-10-01T00:00:00.000Z',
        'schedule-1-duplicate-key'
      ])
    ).rejects.toThrow();
  });
});
