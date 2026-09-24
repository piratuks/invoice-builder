import { processDueInvoiceSchedules as processDueInvoiceSchedulesShared } from '../shared/services/invoiceSchedules';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';
import { APP_CONFIG } from './config';
import { getSmtpPassword } from './smtpPassword';

export type InvoiceScheduleRuntimeProcessor = (db: DatabaseAdapter) => Promise<void>;

type InvoiceScheduleRuntime = {
  timer: ReturnType<typeof setInterval>;
  running: boolean;
  processor: InvoiceScheduleRuntimeProcessor;
  db: DatabaseAdapter;
};

const runtimes = new Map<number, InvoiceScheduleRuntime>();

const getInvoiceScheduleRuntimeIntervalMs = () =>
  Number(process.env.ELECTRON_INVOICE_SCHEDULER_INTERVAL_MS || APP_CONFIG.ELECTRON_INVOICE_SCHEDULER_INTERVAL_MS);

export const processDueInvoiceSchedules: InvoiceScheduleRuntimeProcessor = async db => {
  const result = await processDueInvoiceSchedulesShared(db, { smtpPassword: (await getSmtpPassword()) ?? undefined });
  if (!result.success) throw new Error(result.key ?? result.message ?? 'error.scheduleProcessingFailed');
};

const runRuntimeTick = async (windowId: number) => {
  const runtime = runtimes.get(windowId);
  if (!runtime || runtime.running) return;

  runtime.running = true;
  try {
    await runtime.processor(runtime.db);
  } catch (error) {
    console.error('Invoice schedule runtime failed:', error);
  } finally {
    runtime.running = false;
  }
};

export const startInvoiceScheduleRuntime = (
  windowId: number,
  db: DatabaseAdapter,
  processor: InvoiceScheduleRuntimeProcessor = processDueInvoiceSchedules
) => {
  stopInvoiceScheduleRuntime(windowId);

  const timer = setInterval(() => void runRuntimeTick(windowId), getInvoiceScheduleRuntimeIntervalMs());
  timer.unref?.();

  runtimes.set(windowId, { timer, running: false, processor, db });
  void runRuntimeTick(windowId);
};

export const stopInvoiceScheduleRuntime = (windowId: number) => {
  const runtime = runtimes.get(windowId);
  if (!runtime) return;

  clearInterval(runtime.timer);
  runtimes.delete(windowId);
};

export const stopAllInvoiceScheduleRuntimes = () => {
  for (const windowId of runtimes.keys()) {
    stopInvoiceScheduleRuntime(windowId);
  }
};

export const getInvoiceScheduleRuntimeCount = () => runtimes.size;
