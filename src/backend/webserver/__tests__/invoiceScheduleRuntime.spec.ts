import { DatabaseType } from '../../shared/enums/databaseType';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';
import {
  isWebInvoiceScheduleRuntimeRunning,
  runWebInvoiceScheduleRuntimeTick,
  startWebInvoiceScheduleRuntime,
  stopWebInvoiceScheduleRuntime
} from '../invoiceScheduleRuntime';

const createDatabase = () => ({ type: DatabaseType.sqlite }) as DatabaseAdapter;

describe('webserver invoice schedule runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopWebInvoiceScheduleRuntime();
  });

  afterEach(() => {
    stopWebInvoiceScheduleRuntime();
    delete process.env.WEBSERVER_INVOICE_SCHEDULER_INTERVAL_MS;
    vi.useRealTimers();
  });

  it('runs immediately and then on the configured interval for every open database', async () => {
    process.env.WEBSERVER_INVOICE_SCHEDULER_INTERVAL_MS = '1000';
    const processor = vi.fn().mockResolvedValue(undefined);
    const databases = [
      { databaseKey: 'alpha', db: createDatabase() },
      { databaseKey: 'beta', db: createDatabase() }
    ];

    startWebInvoiceScheduleRuntime(processor, () => databases);
    await Promise.resolve();

    expect(processor).toHaveBeenCalledTimes(2);
    expect(processor).toHaveBeenCalledWith(databases[0].db, 'alpha');
    expect(processor).toHaveBeenCalledWith(databases[1].db, 'beta');

    await vi.advanceTimersByTimeAsync(1000);
    expect(processor).toHaveBeenCalledTimes(4);
  });

  it('keeps scanning other databases when one processor call fails', async () => {
    const processor = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(undefined);
    const databases = [
      { databaseKey: 'alpha', db: createDatabase() },
      { databaseKey: 'beta', db: createDatabase() }
    ];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    startWebInvoiceScheduleRuntime(processor, () => databases);
    await Promise.resolve();

    expect(processor).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(
      'Webserver invoice schedule runtime failed for database alpha:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  it('prevents overlapping ticks for a slow backend pass', async () => {
    process.env.WEBSERVER_INVOICE_SCHEDULER_INTERVAL_MS = '1000';
    let resolveProcessor: (() => void) | undefined;
    const processor = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveProcessor = resolve;
        })
    );

    startWebInvoiceScheduleRuntime(processor, () => [{ databaseKey: 'alpha', db: createDatabase() }]);
    await Promise.resolve();

    await vi.advanceTimersByTimeAsync(3000);
    expect(processor).toHaveBeenCalledTimes(1);

    resolveProcessor?.();
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(1000);
    expect(processor).toHaveBeenCalledTimes(2);
  });

  it('starts only once and can be stopped', () => {
    const firstTimer = startWebInvoiceScheduleRuntime(vi.fn(), () => []);
    const secondTimer = startWebInvoiceScheduleRuntime(vi.fn(), () => []);

    expect(secondTimer).toBe(firstTimer);
    expect(isWebInvoiceScheduleRuntimeRunning()).toBe(true);

    stopWebInvoiceScheduleRuntime();
    expect(isWebInvoiceScheduleRuntimeRunning()).toBe(false);
  });

  it('allows manual ticks for tests and startup catch-up checks', async () => {
    const processor = vi.fn().mockResolvedValue(undefined);
    startWebInvoiceScheduleRuntime(processor, () => [{ databaseKey: 'alpha', db: createDatabase() }]);
    await Promise.resolve();

    await runWebInvoiceScheduleRuntimeTick();

    expect(processor).toHaveBeenCalledTimes(2);
  });
});
