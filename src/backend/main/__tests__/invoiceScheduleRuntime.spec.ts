import { DatabaseType } from '../../shared/enums/databaseType';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';
import {
  getInvoiceScheduleRuntimeCount,
  startInvoiceScheduleRuntime,
  stopAllInvoiceScheduleRuntimes,
  stopInvoiceScheduleRuntime
} from '../invoiceScheduleRuntime';

const createDatabase = () => ({ type: DatabaseType.sqlite }) as DatabaseAdapter;

describe('Electron invoice schedule runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopAllInvoiceScheduleRuntimes();
  });

  afterEach(() => {
    stopAllInvoiceScheduleRuntimes();
    delete process.env.ELECTRON_INVOICE_SCHEDULER_INTERVAL_MS;
    vi.useRealTimers();
  });

  it('runs once immediately and then on the configured interval', async () => {
    process.env.ELECTRON_INVOICE_SCHEDULER_INTERVAL_MS = '1000';
    const processor = vi.fn().mockResolvedValue(undefined);

    startInvoiceScheduleRuntime(1, createDatabase(), processor);
    await Promise.resolve();

    expect(processor).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(processor).toHaveBeenCalledTimes(2);
  });

  it('prevents overlapping ticks for a slow processor', async () => {
    process.env.ELECTRON_INVOICE_SCHEDULER_INTERVAL_MS = '1000';
    let resolveProcessor: (() => void) | undefined;
    const processor = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveProcessor = resolve;
        })
    );

    startInvoiceScheduleRuntime(1, createDatabase(), processor);
    await vi.runOnlyPendingTimersAsync();

    await vi.advanceTimersByTimeAsync(3000);
    expect(processor).toHaveBeenCalledTimes(1);

    resolveProcessor?.();
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(1000);
    expect(processor).toHaveBeenCalledTimes(2);
  });

  it('replaces and stops window runtimes independently', async () => {
    const firstProcessor = vi.fn().mockResolvedValue(undefined);
    const secondProcessor = vi.fn().mockResolvedValue(undefined);

    startInvoiceScheduleRuntime(1, createDatabase(), firstProcessor);
    startInvoiceScheduleRuntime(2, createDatabase(), secondProcessor);
    expect(getInvoiceScheduleRuntimeCount()).toBe(2);

    stopInvoiceScheduleRuntime(1);
    expect(getInvoiceScheduleRuntimeCount()).toBe(1);

    stopAllInvoiceScheduleRuntimes();
    expect(getInvoiceScheduleRuntimeCount()).toBe(0);
  });
});
