import { processDueInvoiceSchedules as processDueInvoiceSchedulesShared } from '../shared/services/invoiceSchedules';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';
import { APP_CONFIG } from './config';
import { getOpenDatabases } from './database';

export type WebInvoiceScheduleRuntimeProcessor = (db: DatabaseAdapter, databaseKey: string) => Promise<void>;
export type WebInvoiceScheduleRuntimeDatabaseProvider = () => { databaseKey: string; db: DatabaseAdapter }[];

type WebInvoiceScheduleRuntime = {
  timer: ReturnType<typeof setInterval>;
  running: boolean;
  processor: WebInvoiceScheduleRuntimeProcessor;
  getDatabases: WebInvoiceScheduleRuntimeDatabaseProvider;
};

let runtime: WebInvoiceScheduleRuntime | undefined;

const getInvoiceScheduleRuntimeIntervalMs = () =>
  Number(process.env.WEBSERVER_INVOICE_SCHEDULER_INTERVAL_MS || APP_CONFIG.WEBSERVER_INVOICE_SCHEDULER_INTERVAL_MS);

export const processDueInvoiceSchedules: WebInvoiceScheduleRuntimeProcessor = async db => {
  const result = await processDueInvoiceSchedulesShared(db, {
    smtpPassword: process.env.SMTP_PASSWORD || APP_CONFIG.SMTP_PASSWORD
  });
  if (!result.success) throw new Error(result.key ?? result.message ?? 'error.scheduleProcessingFailed');
};

export const runWebInvoiceScheduleRuntimeTick = async () => {
  if (!runtime || runtime.running) return;

  runtime.running = true;
  try {
    for (const { databaseKey, db } of runtime.getDatabases()) {
      try {
        await runtime.processor(db, databaseKey);
      } catch (error) {
        console.error(`Webserver invoice schedule runtime failed for database ${databaseKey}:`, error);
      }
    }
  } finally {
    runtime.running = false;
  }
};

export const startWebInvoiceScheduleRuntime = (
  processor: WebInvoiceScheduleRuntimeProcessor = processDueInvoiceSchedules,
  getDatabases: WebInvoiceScheduleRuntimeDatabaseProvider = getOpenDatabases
) => {
  if (runtime) return runtime.timer;

  const timer = setInterval(() => void runWebInvoiceScheduleRuntimeTick(), getInvoiceScheduleRuntimeIntervalMs());
  timer.unref?.();

  runtime = { timer, running: false, processor, getDatabases };
  void runWebInvoiceScheduleRuntimeTick();
  return timer;
};

export const stopWebInvoiceScheduleRuntime = () => {
  if (!runtime) return;
  clearInterval(runtime.timer);
  runtime = undefined;
};

export const isWebInvoiceScheduleRuntimeRunning = () => Boolean(runtime);
