import sqlite3 from 'sqlite3';
import { createSqliteAdapter } from '../../db/client';
import { initInitialData, initSchema } from '../../db/setup';
import {
  InvoiceScheduleCadence,
  InvoiceScheduleDeliveryMethod,
  InvoiceScheduleStatus
} from '../../enums/invoiceSchedule';
import { InvoiceStatus } from '../../enums/invoiceStatus';
import { InvoiceType } from '../../enums/invoiceType';
import { Language } from '../../enums/language';
import { up as invoiceSchedulesMigration } from '../../migrations/20260923-32-invoice-schedules';
import { up as invoiceScheduleDeliveryMigration } from '../../migrations/20260925-34-invoice-schedule-delivery';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import type {
  Invoice,
  InvoiceBusinessSnapshots,
  InvoiceClientSnapshots,
  InvoiceCurrencySnapshots
} from '../../types/invoice';
import type { InvoiceSchedule } from '../../types/invoiceSchedule';
import {
  addInvoiceSchedule,
  advanceScheduleAfterRun,
  calculateNextRunAt,
  claimScheduleRun,
  completeScheduleRun,
  deleteInvoiceSchedule,
  getAllInvoiceSchedules,
  getDueSchedules,
  getInvoiceScheduleRuns,
  processDueInvoiceSchedules,
  updateInvoiceSchedule
} from '../invoiceSchedules';
import { addInvoice } from '../invoices';
import { createTestDatabase } from './testDb';

const setupDb = async () => {
  const db = createSqliteAdapter(new sqlite3.Database(':memory:'));
  await initSchema(db);
  await invoiceSchedulesMigration(db);
  await invoiceScheduleDeliveryMigration(db);
  await initInitialData(db);
  return db;
};

const insertSourceInvoice = async (db: DatabaseAdapter) => {
  const businessId = await db.run(
    `INSERT INTO businesses ("name", "shortName") VALUES (?, ?)`,
    ['Business', 'BI'],
    true
  );
  const clientId = await db.run(`INSERT INTO clients ("name", "shortName") VALUES (?, ?)`, ['Client', 'CL'], true);
  const currency = await db.get<{ id: number }>(`SELECT "id" FROM currencies WHERE "code" = ?`, ['USD']);

  return db.run(
    `INSERT INTO invoices (
      "invoiceType", "businessId", "clientId", "currencyId", "issuedAt", "invoiceNumber",
      "businessNameSnapshot", "businessShortNameSnapshot", "clientNameSnapshot",
      "currencyCodeSnapshot", "currencySymbolSnapshot", "currencySubunitSnapshot"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      InvoiceType.invoice,
      businessId,
      clientId,
      currency?.id ?? -1,
      '2026-01-01T09:00:00.000Z',
      '1',
      'Business',
      'BI',
      'Client',
      'USD',
      '$',
      100
    ],
    true
  );
};

const insertSchedule = async (db: DatabaseAdapter, overrides: Partial<InvoiceSchedule> = {}) => {
  const sourceInvoiceId = overrides.sourceInvoiceId ?? (await insertSourceInvoice(db));
  const schedule = {
    sourceInvoiceId,
    cadence: InvoiceScheduleCadence.monthly,
    intervalCount: 1,
    timezone: 'UTC',
    startAt: '2026-01-31T09:00:00.000Z',
    endAt: null,
    maxOccurrences: null,
    nextRunAt: '2026-01-31T09:00:00.000Z',
    lastRunAt: null,
    dueDateOffsetDays: 14,
    status: InvoiceScheduleStatus.active,
    isArchived: false,
    deliveryMethod: InvoiceScheduleDeliveryMethod.none,
    failureReason: null,
    ...overrides
  };

  const id = await db.run(
    `INSERT INTO invoice_schedules (
      "sourceInvoiceId", "cadence", "intervalCount", "timezone", "startAt", "endAt",
      "maxOccurrences", "nextRunAt", "lastRunAt", "dueDateOffsetDays", "status",
      "isArchived", "deliveryMethod", "failureReason"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      schedule.sourceInvoiceId,
      schedule.cadence,
      schedule.intervalCount,
      schedule.timezone,
      schedule.startAt,
      schedule.endAt,
      schedule.maxOccurrences,
      schedule.nextRunAt,
      schedule.lastRunAt,
      schedule.dueDateOffsetDays,
      schedule.status,
      schedule.isArchived,
      schedule.deliveryMethod,
      schedule.failureReason
    ],
    true
  );

  const row = await db.get<InvoiceSchedule>('SELECT * FROM invoice_schedules WHERE "id" = ?', [id]);
  if (!row) throw new Error('failed to insert schedule fixture');
  return row;
};

type NewInvoicePayload = Omit<
  Invoice,
  'invoiceBusinessSnapshot' | 'invoiceClientSnapshot' | 'invoiceCurrencySnapshot'
> & {
  invoiceBusinessSnapshot: Omit<InvoiceBusinessSnapshots, 'parentInvoiceId'> & { parentInvoiceId: number };
  invoiceClientSnapshot: Omit<InvoiceClientSnapshots, 'parentInvoiceId'> & { parentInvoiceId: number };
  invoiceCurrencySnapshot: Omit<InvoiceCurrencySnapshots, 'parentInvoiceId'> & { parentInvoiceId: number };
};

const createInvoicePayload = (
  businessId: number,
  clientId: number,
  currencyId: number,
  invoiceNumber: string
): NewInvoicePayload => {
  const now = '2025-12-15T09:00:00.000Z';
  return {
    invoiceType: InvoiceType.invoice,
    businessId,
    clientId,
    currencyId,
    createdAt: now,
    updatedAt: now,
    issuedAt: now,
    invoiceNumber,
    isArchived: false,
    status: InvoiceStatus.unpaid,
    discountAmountCents: '0',
    discountPercent: 0,
    shippingFeeCents: '0',
    surchargeAmountCents: '0',
    surchargePercent: 0,
    taxRate: 0,
    invoicePayments: [],
    invoiceItems: [],
    invoiceAttachments: [],
    currencyFormat: 'USD',
    language: Language.en,
    invoiceBusinessSnapshot: {
      parentInvoiceId: 0,
      businessName: 'Scheduled Business',
      businessShortName: 'SB'
    },
    invoiceClientSnapshot: {
      parentInvoiceId: 0,
      clientName: 'Scheduled Client'
    },
    invoiceCurrencySnapshot: {
      parentInvoiceId: 0,
      currencyCode: 'USD',
      currencySymbol: '$',
      currencySubunit: 100
    }
  };
};

const setupFullDb = async () => {
  const db = await createTestDatabase();
  await invoiceSchedulesMigration(db);
  await invoiceScheduleDeliveryMigration(db);
  return db;
};

const createSourceInvoice = async (db: DatabaseAdapter) => {
  const businessId = await db.run(
    `INSERT INTO businesses ("name", "shortName") VALUES (?, ?)`,
    ['Business', 'SB'],
    true
  );
  const clientId = await db.run(`INSERT INTO clients ("name", "shortName") VALUES (?, ?)`, ['Client', 'SC'], true);
  const currency = await db.get<{ id: number }>(`SELECT "id" FROM currencies WHERE "code" = ?`, ['USD']);
  const result = await addInvoice(db, createInvoicePayload(businessId, clientId, currency?.id ?? -1, '1') as Invoice);

  const invoice = Array.isArray(result.data) ? undefined : (result.data as Invoice | undefined);
  if (!result.success || !invoice?.id) throw new Error('failed to create source invoice fixture');
  return invoice;
};

describe('invoice schedule recurrence', () => {
  it('calculates weekly, quarterly, and yearly next run dates', () => {
    expect(
      calculateNextRunAt({
        cadence: InvoiceScheduleCadence.weekly,
        intervalCount: 2,
        startAt: '2026-01-05T09:00:00.000Z',
        currentRunAt: '2026-01-05T09:00:00.000Z'
      })
    ).toBe('2026-01-19T09:00:00.000Z');

    expect(
      calculateNextRunAt({
        cadence: InvoiceScheduleCadence.quarterly,
        intervalCount: 1,
        startAt: '2026-01-15T09:00:00.000Z',
        currentRunAt: '2026-01-15T09:00:00.000Z'
      })
    ).toBe('2026-04-15T09:00:00.000Z');

    expect(
      calculateNextRunAt({
        cadence: InvoiceScheduleCadence.yearly,
        intervalCount: 1,
        startAt: '2024-02-29T09:00:00.000Z',
        currentRunAt: '2024-02-29T09:00:00.000Z'
      })
    ).toBe('2025-02-28T09:00:00.000Z');
  });

  it('keeps the original monthly anchor day after a shorter month', () => {
    const febRun = calculateNextRunAt({
      cadence: InvoiceScheduleCadence.monthly,
      intervalCount: 1,
      startAt: '2026-01-31T09:00:00.000Z',
      currentRunAt: '2026-01-31T09:00:00.000Z'
    });
    expect(febRun).toBe('2026-02-28T09:00:00.000Z');

    expect(
      calculateNextRunAt({
        cadence: InvoiceScheduleCadence.monthly,
        intervalCount: 1,
        startAt: '2026-01-31T09:00:00.000Z',
        currentRunAt: febRun!
      })
    ).toBe('2026-03-31T09:00:00.000Z');
  });

  it('stops when end date or max occurrences has been reached', () => {
    expect(
      calculateNextRunAt({
        cadence: InvoiceScheduleCadence.monthly,
        intervalCount: 1,
        startAt: '2026-01-31T09:00:00.000Z',
        currentRunAt: '2026-01-31T09:00:00.000Z',
        endAt: '2026-02-15T09:00:00.000Z'
      })
    ).toBeUndefined();

    expect(
      calculateNextRunAt({
        cadence: InvoiceScheduleCadence.monthly,
        intervalCount: 1,
        startAt: '2026-01-31T09:00:00.000Z',
        currentRunAt: '2026-01-31T09:00:00.000Z',
        maxOccurrences: 1,
        completedOccurrences: 1
      })
    ).toBeUndefined();
  });
});

describe('invoice schedule service', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await setupDb();
  });

  afterEach(async () => {
    await db.close();
  });

  it('returns only active schedules due by the supplied time', async () => {
    const sourceInvoiceId = await insertSourceInvoice(db);
    const dueSchedule = await insertSchedule(db, { sourceInvoiceId, nextRunAt: '2026-01-10T09:00:00.000Z' });
    await insertSchedule(db, { sourceInvoiceId, nextRunAt: '2026-01-12T09:00:00.000Z' });
    await insertSchedule(db, {
      sourceInvoiceId,
      nextRunAt: '2026-01-09T09:00:00.000Z',
      status: InvoiceScheduleStatus.paused
    });

    const result = await getDueSchedules(db, new Date('2026-01-11T09:00:00.000Z'));

    expect(result.success).toBe(true);
    expect(result.data?.map(schedule => schedule.id)).toEqual([dueSchedule.id]);
  });

  it('adds, lists, updates, deletes, and reads run history for schedules', async () => {
    const sourceInvoiceId = await insertSourceInvoice(db);
    const addResult = await addInvoiceSchedule(db, {
      sourceInvoiceId,
      cadence: InvoiceScheduleCadence.monthly,
      intervalCount: 1,
      timezone: 'UTC',
      startAt: '2026-02-01T09:00:00.000Z',
      dueDateOffsetDays: 14,
      status: InvoiceScheduleStatus.active,
      isArchived: false,
      deliveryMethod: InvoiceScheduleDeliveryMethod.none
    });

    expect(addResult.success).toBe(true);
    expect(addResult.data?.nextRunAt).toBe('2026-02-01T09:00:00.000Z');

    const listResult = await getAllInvoiceSchedules(db);
    expect(listResult.data?.some(schedule => schedule.id === addResult.data?.id)).toBe(true);

    const updateResult = await updateInvoiceSchedule(db, {
      id: addResult.data!.id!,
      status: InvoiceScheduleStatus.paused,
      failureReason: 'Waiting for review'
    });
    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.status).toBe(InvoiceScheduleStatus.paused);
    expect(updateResult.data?.failureReason).toBe('Waiting for review');

    const archivedResult = await updateInvoiceSchedule(db, {
      id: addResult.data!.id!,
      isArchived: true,
      status: InvoiceScheduleStatus.active
    });
    expect(archivedResult.success).toBe(true);
    expect(archivedResult.data?.isArchived).toBe(true);
    expect(archivedResult.data?.status).toBe(InvoiceScheduleStatus.paused);

    await claimScheduleRun(db, updateResult.data!, updateResult.data!.nextRunAt);
    const runsResult = await getInvoiceScheduleRuns(db, updateResult.data!.id!);
    expect(runsResult.success).toBe(true);
    expect(runsResult.data).toHaveLength(1);

    const deleteResult = await deleteInvoiceSchedule(db, updateResult.data!.id!);
    expect(deleteResult.success).toBe(true);
    const afterDelete = await getAllInvoiceSchedules(db);
    expect(afterDelete.data?.some(schedule => schedule.id === updateResult.data?.id)).toBe(false);
  });

  it('claims a due occurrence only once', async () => {
    const schedule = await insertSchedule(db, { deliveryMethod: InvoiceScheduleDeliveryMethod.email });

    const firstClaim = await claimScheduleRun(db, schedule, schedule.nextRunAt, new Date('2026-01-31T09:01:00.000Z'));
    const secondClaim = await claimScheduleRun(db, schedule, schedule.nextRunAt, new Date('2026-01-31T09:02:00.000Z'));

    expect(firstClaim.success).toBe(true);
    expect(firstClaim.data?.claimed).toBe(true);
    expect(firstClaim.data?.run.deliveryStatus).toBe('pending');
    expect(secondClaim.success).toBe(true);
    expect(secondClaim.data?.claimed).toBe(false);
    expect(secondClaim.data?.run.id).toBe(firstClaim.data?.run.id);
  });

  it('completes the final occurrence and marks the schedule completed', async () => {
    const schedule = await insertSchedule(db, { maxOccurrences: 1 });
    const claim = await claimScheduleRun(db, schedule);
    expect(claim.success).toBe(true);
    expect(claim.data?.run.id).toBeDefined();

    const completeResult = await completeScheduleRun(
      db,
      claim.data!.run.id!,
      undefined,
      new Date('2026-01-31T09:02:00.000Z')
    );
    expect(completeResult.success).toBe(true);
    expect(completeResult.data?.status).toBe('success');

    const advanceResult = await advanceScheduleAfterRun(db, schedule);
    expect(advanceResult.success).toBe(true);
    expect(advanceResult.data?.status).toBe(InvoiceScheduleStatus.completed);
    expect(advanceResult.data?.lastRunAt).toBe(schedule.nextRunAt);
  });
});

describe('invoice schedule generation worker', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await setupFullDb();
  });

  afterEach(async () => {
    await db.close();
  });

  it('generates due invoices, applies due-date offset, records runs, and advances the schedule', async () => {
    const sourceInvoice = await createSourceInvoice(db);
    const scheduleResult = await addInvoiceSchedule(db, {
      sourceInvoiceId: sourceInvoice.id!,
      cadence: InvoiceScheduleCadence.monthly,
      intervalCount: 1,
      timezone: 'UTC',
      startAt: '2026-01-01T09:00:00.000Z',
      maxOccurrences: 2,
      dueDateOffsetDays: 10,
      status: InvoiceScheduleStatus.active,
      isArchived: false,
      deliveryMethod: InvoiceScheduleDeliveryMethod.none
    });

    expect(scheduleResult.success).toBe(true);
    const result = await processDueInvoiceSchedules(db, { now: new Date('2026-03-15T00:00:00.000Z') });

    expect(result).toEqual({ success: true, data: { processed: 2 } });

    const generatedInvoices = await db.all<Invoice>(
      `SELECT * FROM invoices WHERE "id" != ? ORDER BY "invoiceNumber" ASC`,
      [sourceInvoice.id]
    );
    expect(generatedInvoices.map(invoice => invoice.invoiceNumber)).toEqual(['2', '3']);
    expect(generatedInvoices.map(invoice => invoice.issuedAt)).toEqual([
      '2026-01-01T09:00:00.000Z',
      '2026-02-01T09:00:00.000Z'
    ]);
    expect(generatedInvoices.map(invoice => invoice.dueDate)).toEqual([
      '2026-01-11T09:00:00.000Z',
      '2026-02-11T09:00:00.000Z'
    ]);

    const runs = await getInvoiceScheduleRuns(db, scheduleResult.data!.id!);
    expect(runs.data?.map(run => run.status)).toEqual(['success', 'success']);
    expect(runs.data?.every(run => run.generatedInvoiceId != null)).toBe(true);

    const schedules = await getAllInvoiceSchedules(db);
    expect(schedules.data?.[0].status).toBe(InvoiceScheduleStatus.completed);
    expect(schedules.data?.[0].lastRunAt).toBe('2026-02-01T09:00:00.000Z');

    const secondPass = await processDueInvoiceSchedules(db, { now: new Date('2026-03-15T00:00:00.000Z') });
    expect(secondPass).toEqual({ success: true, data: { processed: 0 } });
  });

  it('records failed email delivery attempts when SMTP is not configured', async () => {
    const sourceInvoice = await createSourceInvoice(db);
    const scheduleResult = await addInvoiceSchedule(db, {
      sourceInvoiceId: sourceInvoice.id!,
      cadence: InvoiceScheduleCadence.monthly,
      intervalCount: 1,
      timezone: 'UTC',
      startAt: '2026-01-01T09:00:00.000Z',
      maxOccurrences: 1,
      dueDateOffsetDays: 10,
      status: InvoiceScheduleStatus.active,
      isArchived: false,
      deliveryMethod: InvoiceScheduleDeliveryMethod.email
    });

    expect(scheduleResult.success).toBe(true);
    const result = await processDueInvoiceSchedules(db, { now: new Date('2026-01-02T00:00:00.000Z') });
    expect(result).toEqual({ success: true, data: { processed: 1 } });

    const runs = await getInvoiceScheduleRuns(db, scheduleResult.data!.id!);
    expect(runs.data?.[0]).toEqual(
      expect.objectContaining({
        deliveryStatus: 'failed',
        deliveryError: 'error.clientEmailRequired',
        deliveryAttemptError: 'error.clientEmailRequired'
      })
    );
  });
});
