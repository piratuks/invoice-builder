import {
  InvoiceScheduleCadence,
  InvoiceScheduleDeliveryMethod,
  InvoiceScheduleDeliveryStatus,
  InvoiceScheduleRunStatus,
  InvoiceScheduleStatus
} from '../enums/invoiceSchedule';
import { InvoiceType } from '../enums/invoiceType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { Invoice } from '../types/invoice';
import type {
  InvoiceSchedule,
  InvoiceScheduleAdd,
  InvoiceScheduleRun,
  InvoiceScheduleUpdate
} from '../types/invoiceSchedule';
import type { Response } from '../types/response';
import { getDefaultValue, prepareUpdate } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';
import { duplicateInvoice } from './invoices';

export type CalculateNextRunAtData = Pick<
  InvoiceSchedule,
  'cadence' | 'intervalCount' | 'startAt' | 'endAt' | 'maxOccurrences'
> & {
  currentRunAt: string;
  completedOccurrences?: number;
};

export type ClaimScheduleRunResult = {
  claimed: boolean;
  run: InvoiceScheduleRun;
};

export type ProcessDueInvoiceSchedulesOptions = {
  now?: Date;
  maxRunsPerSchedule?: number;
};

const invoiceScheduleFields: (keyof InvoiceScheduleAdd)[] = [
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
];

function toValidDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('error.invalidScheduleDate');
  return date;
}

const toIso = (date: Date) => date.toISOString();

const addUtcDays = (date: Date, daysToAdd: number) => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + daysToAdd);
  return next;
};

const getLastDayOfUtcMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const addUtcMonths = (date: Date, monthsToAdd: number, anchorDay: number): Date => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + monthsToAdd;
  const target = new Date(
    Date.UTC(year, month, 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds())
  );
  const day = Math.min(anchorDay, getLastDayOfUtcMonth(target.getUTCFullYear(), target.getUTCMonth()));
  target.setUTCDate(day);
  return target;
};

const addCadence = (currentRunAt: Date, cadence: InvoiceScheduleCadence, intervalCount: number, startAt: Date) => {
  switch (cadence) {
    case InvoiceScheduleCadence.weekly: {
      const next = new Date(currentRunAt.getTime());
      next.setUTCDate(next.getUTCDate() + intervalCount * 7);
      return next;
    }
    case InvoiceScheduleCadence.monthly:
      return addUtcMonths(currentRunAt, intervalCount, startAt.getUTCDate());
    case InvoiceScheduleCadence.quarterly:
      return addUtcMonths(currentRunAt, intervalCount * 3, startAt.getUTCDate());
    case InvoiceScheduleCadence.yearly:
      return addUtcMonths(currentRunAt, intervalCount * 12, startAt.getUTCDate());
  }
};

export const calculateNextRunAt = (data: CalculateNextRunAtData): string | undefined => {
  if (data.intervalCount <= 0) throw new Error('error.invalidScheduleInterval');
  if (data.maxOccurrences != null && (data.completedOccurrences ?? 0) >= data.maxOccurrences) return undefined;

  const startAt = toValidDate(data.startAt);
  const currentRunAt = toValidDate(data.currentRunAt);
  const nextRunAt = addCadence(currentRunAt, data.cadence, data.intervalCount, startAt);

  if (data.endAt != null && nextRunAt.getTime() > toValidDate(data.endAt).getTime()) return undefined;

  return toIso(nextRunAt);
};

export const buildScheduleRunIdempotencyKey = (scheduleId: number, dueAt: string) => {
  return `invoice-schedule:${scheduleId}:${toIso(toValidDate(dueAt))}`;
};

export const getDueSchedules = async (db: DatabaseAdapter, now = new Date()): Promise<Response<InvoiceSchedule[]>> => {
  try {
    const schedules = await db.all<InvoiceSchedule>(
      `SELECT * FROM invoice_schedules
       WHERE "status" = ? AND "nextRunAt" <= ?
       ORDER BY "nextRunAt" ASC, "id" ASC`,
      [InvoiceScheduleStatus.active, toIso(now)]
    );
    return { success: true, data: schedules };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const getAllInvoiceSchedules = async (db: DatabaseAdapter): Promise<Response<InvoiceSchedule[]>> => {
  try {
    const schedules = await db.all<InvoiceSchedule>(
      `SELECT * FROM invoice_schedules ORDER BY "createdAt" DESC, "id" DESC`
    );
    return { success: true, data: schedules };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const getInvoiceScheduleRuns = async (
  db: DatabaseAdapter,
  scheduleId: number
): Promise<Response<InvoiceScheduleRun[]>> => {
  try {
    const runs = await db.all<InvoiceScheduleRun>(
      `SELECT * FROM invoice_schedule_runs WHERE "scheduleId" = ? ORDER BY "dueAt" DESC, "id" DESC`,
      [scheduleId]
    );
    return { success: true, data: runs };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const addInvoiceSchedule = async (
  db: DatabaseAdapter,
  data: InvoiceScheduleAdd
): Promise<Response<InvoiceSchedule>> => {
  try {
    const schedule = { ...data, nextRunAt: data.nextRunAt ?? data.startAt };
    const params = invoiceScheduleFields.map(key => schedule[key] ?? null);
    const id = await db.run(
      `INSERT INTO invoice_schedules (${invoiceScheduleFields.map(field => `"${String(field)}"`).join(',')})
       VALUES (${invoiceScheduleFields.map(() => '?').join(',')})`,
      params,
      true
    );

    const row = await getScheduleById(db, id);
    if (!row) return { success: false, key: 'error.scheduleNotFound' };
    return { success: true, data: row };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const updateInvoiceSchedule = async (
  db: DatabaseAdapter,
  data: InvoiceScheduleUpdate
): Promise<Response<InvoiceSchedule>> => {
  try {
    const { id, ...rest } = data;
    const updatedSchedule = await updateScheduleRecord(db, id, rest as Record<string, string | number | null>);
    if (!updatedSchedule) return { success: false, key: 'error.scheduleNotFound' };
    return { success: true, data: updatedSchedule };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const deleteInvoiceSchedule = async (db: DatabaseAdapter, id: number): Promise<Response<unknown>> => {
  try {
    await db.run('DELETE FROM invoice_schedules WHERE "id" = ?', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const processDueInvoiceSchedules = async (
  db: DatabaseAdapter,
  options: ProcessDueInvoiceSchedulesOptions = {}
): Promise<Response<{ processed: number }>> => {
  const now = options.now ?? new Date();
  const maxRunsPerSchedule = options.maxRunsPerSchedule ?? 24;
  const dueSchedules = await getDueSchedules(db, now);
  if (!dueSchedules.success) {
    return { success: false, key: dueSchedules.key, message: dueSchedules.message };
  }

  let processed = 0;

  for (const schedule of dueSchedules.data ?? []) {
    let currentSchedule: InvoiceSchedule | null = schedule;
    let runsForSchedule = 0;

    while (
      currentSchedule?.id != null &&
      currentSchedule.status === InvoiceScheduleStatus.active &&
      toValidDate(currentSchedule.nextRunAt).getTime() <= now.getTime() &&
      runsForSchedule < maxRunsPerSchedule
    ) {
      const result = await generateInvoiceForScheduleRun(db, currentSchedule, currentSchedule.nextRunAt, now);
      if (!result.success) return { success: false, key: result.key, message: result.message };
      if (!result.data?.processed) break;

      processed += 1;
      runsForSchedule += 1;
      currentSchedule = result.data.schedule;
    }
  }

  return { success: true, data: { processed } };
};

const updateGeneratedInvoiceDates = async (
  db: DatabaseAdapter,
  invoiceId: number,
  dueAt: string,
  dueDateOffsetDays: number
) => {
  const issuedAt = toIso(toValidDate(dueAt));
  const dueDate = toIso(addUtcDays(toValidDate(dueAt), dueDateOffsetDays));
  await db.run(
    `UPDATE invoices
     SET "issuedAt" = ?, "dueDate" = ?, "updatedAt" = ${getDefaultValue("datetime('now')", db.type)}
     WHERE "id" = ?`,
    [issuedAt, dueDate, invoiceId]
  );
};

const generateInvoiceForScheduleRun = async (
  db: DatabaseAdapter,
  schedule: InvoiceSchedule,
  dueAt: string,
  now: Date
): Promise<Response<{ processed: boolean; schedule: InvoiceSchedule }>> => {
  const claim = await claimScheduleRun(db, schedule, dueAt, now);
  if (!claim.success || !claim.data) return { success: false, key: claim.key, message: claim.message };
  if (!claim.data.claimed) return { success: true, data: { processed: false, schedule } };

  try {
    const sourceInvoice = await db.get<Pick<Invoice, 'invoiceType'>>(
      'SELECT "invoiceType" FROM invoices WHERE "id" = ?',
      [schedule.sourceInvoiceId]
    );
    if (!sourceInvoice) throw new Error('error.invoiceNotFound');

    const duplicateResult = await duplicateInvoice(
      db,
      schedule.sourceInvoiceId,
      sourceInvoice.invoiceType as InvoiceType
    );
    if (!duplicateResult.success || !duplicateResult.data || Array.isArray(duplicateResult.data)) {
      throw new Error('error.invoiceNotFound');
    }

    const generatedInvoice = duplicateResult.data as Invoice;
    if (generatedInvoice.id == null) throw new Error('error.invoiceNotFound');

    await updateGeneratedInvoiceDates(db, generatedInvoice.id, dueAt, schedule.dueDateOffsetDays);
    const completeResult = await completeScheduleRun(
      db,
      claim.data.run.id!,
      {
        generatedInvoiceId: generatedInvoice.id,
        deliveryStatus:
          schedule.deliveryMethod === InvoiceScheduleDeliveryMethod.email
            ? InvoiceScheduleDeliveryStatus.pending
            : InvoiceScheduleDeliveryStatus.notApplicable
      },
      now
    );
    if (!completeResult.success) {
      throw new Error(completeResult.key ?? completeResult.message ?? 'error.scheduleRunNotFound');
    }

    const advanceResult = await advanceScheduleAfterRun(db, schedule, dueAt);
    if (!advanceResult.success || !advanceResult.data) {
      throw new Error(advanceResult.key ?? advanceResult.message ?? 'error.scheduleNotFound');
    }

    return { success: true, data: { processed: true, schedule: advanceResult.data } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await failScheduleRun(db, claim.data.run.id!, message, now);
    if (schedule.id != null) {
      await updateScheduleRecord(db, schedule.id, { status: InvoiceScheduleStatus.failed, failureReason: message });
    }
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const claimScheduleRun = async (
  db: DatabaseAdapter,
  schedule: InvoiceSchedule,
  dueAt = schedule.nextRunAt,
  now = new Date()
): Promise<Response<ClaimScheduleRunResult>> => {
  try {
    if (schedule.id == null) return { success: false, key: 'error.invalidSchedule' };

    const idempotencyKey = buildScheduleRunIdempotencyKey(schedule.id, dueAt);
    const deliveryStatus =
      schedule.deliveryMethod === InvoiceScheduleDeliveryMethod.email
        ? InvoiceScheduleDeliveryStatus.pending
        : InvoiceScheduleDeliveryStatus.notApplicable;

    try {
      const runId = await db.run(
        `INSERT INTO invoice_schedule_runs (
          "scheduleId", "dueAt", "idempotencyKey", "startedAt", "status", "deliveryStatus"
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [schedule.id, dueAt, idempotencyKey, toIso(now), InvoiceScheduleRunStatus.running, deliveryStatus],
        true
      );
      const run = await db.get<InvoiceScheduleRun>('SELECT * FROM invoice_schedule_runs WHERE "id" = ?', [runId]);
      if (!run) return { success: false, key: 'error.scheduleRunNotFound' };
      return { success: true, data: { claimed: true, run } };
    } catch {
      const run = await db.get<InvoiceScheduleRun>(
        'SELECT * FROM invoice_schedule_runs WHERE "scheduleId" = ? AND "dueAt" = ?',
        [schedule.id, dueAt]
      );
      if (!run) throw new Error('error.scheduleRunClaimFailed');
      return { success: true, data: { claimed: false, run } };
    }
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

const getRunCount = async (db: DatabaseAdapter, scheduleId: number) => {
  const row = await db.get<{ count: number }>(
    'SELECT COUNT(*) as "count" FROM invoice_schedule_runs WHERE "scheduleId" = ?',
    [scheduleId]
  );
  return Number(row?.count ?? 0);
};

const getScheduleById = (db: DatabaseAdapter, id: number) =>
  db.get<InvoiceSchedule>('SELECT * FROM invoice_schedules WHERE "id" = ?', [id]);

const getScheduleRunById = (db: DatabaseAdapter, id: number) =>
  db.get<InvoiceScheduleRun>('SELECT * FROM invoice_schedule_runs WHERE "id" = ?', [id]);

const updateScheduleRecord = async (db: DatabaseAdapter, id: number, data: Record<string, string | number | null>) => {
  const { fields, params } = prepareUpdate(data, id);
  fields.push(`"updatedAt" = ${getDefaultValue("datetime('now')", db.type)}`);
  await db.run(`UPDATE invoice_schedules SET ${fields.join(', ')} WHERE "id" = ?`, params);
  return getScheduleById(db, id);
};

const updateScheduleRunRecord = async (
  db: DatabaseAdapter,
  id: number,
  data: Record<string, string | number | null>
) => {
  const { fields, params } = prepareUpdate(data, id);
  fields.push(`"updatedAt" = ${getDefaultValue("datetime('now')", db.type)}`);
  await db.run(`UPDATE invoice_schedule_runs SET ${fields.join(', ')} WHERE "id" = ?`, params);
  return getScheduleRunById(db, id);
};

export const advanceScheduleAfterRun = async (
  db: DatabaseAdapter,
  schedule: InvoiceSchedule,
  dueAt = schedule.nextRunAt
): Promise<Response<InvoiceSchedule>> => {
  try {
    if (schedule.id == null) return { success: false, key: 'error.invalidSchedule' };

    const completedOccurrences = await getRunCount(db, schedule.id);
    const nextRunAt = calculateNextRunAt({ ...schedule, currentRunAt: dueAt, completedOccurrences });

    const updatedSchedule = await updateScheduleRecord(
      db,
      schedule.id,
      nextRunAt
        ? { lastRunAt: dueAt, nextRunAt, failureReason: null }
        : { lastRunAt: dueAt, status: InvoiceScheduleStatus.completed, failureReason: null }
    );
    if (!updatedSchedule) return { success: false, key: 'error.scheduleNotFound' };

    return { success: true, data: updatedSchedule };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const completeScheduleRun = async (
  db: DatabaseAdapter,
  runId: number,
  data: { generatedInvoiceId?: number; deliveryStatus?: InvoiceScheduleDeliveryStatus } = {},
  now = new Date()
): Promise<Response<InvoiceScheduleRun>> => {
  try {
    const run = await updateScheduleRunRecord(db, runId, {
      completedAt: toIso(now),
      generatedInvoiceId: data.generatedInvoiceId ?? null,
      status: InvoiceScheduleRunStatus.success,
      deliveryStatus: data.deliveryStatus ?? InvoiceScheduleDeliveryStatus.notApplicable,
      deliveryError: null,
      errorMessage: null
    });
    if (!run) return { success: false, key: 'error.scheduleRunNotFound' };
    return { success: true, data: run };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const failScheduleRun = async (
  db: DatabaseAdapter,
  runId: number,
  errorMessage: string,
  now = new Date()
): Promise<Response<InvoiceScheduleRun>> => {
  try {
    const run = await updateScheduleRunRecord(db, runId, {
      completedAt: toIso(now),
      status: InvoiceScheduleRunStatus.failed,
      deliveryStatus: InvoiceScheduleDeliveryStatus.failed,
      errorMessage
    });
    if (!run) return { success: false, key: 'error.scheduleRunNotFound' };
    return { success: true, data: run };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
