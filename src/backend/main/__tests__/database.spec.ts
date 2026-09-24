import { DatabaseType } from '../../shared/enums/databaseType';
import type { DatabaseAdapter } from '../../shared/types/DatabaseAdapter';
import { cleanupDatabase, databases, requireDatabase } from '../database';
import {
  getInvoiceScheduleRuntimeCount,
  startInvoiceScheduleRuntime,
  stopAllInvoiceScheduleRuntimes
} from '../invoiceScheduleRuntime';

vi.mock('electron', () => ({ app: { isPackaged: false } }));

const createDatabase = () =>
  ({
    type: DatabaseType.sqlite,
    run: vi.fn(),
    get: vi.fn(),
    all: vi.fn(),
    query: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined)
  }) as unknown as DatabaseAdapter;

describe('window database contexts', () => {
  beforeEach(() => {
    databases.clear();
    stopAllInvoiceScheduleRuntimes();
  });

  afterEach(() => {
    stopAllInvoiceScheduleRuntimes();
  });

  it('resolves different databases for different renderer window IDs', () => {
    const firstDatabase = createDatabase();
    const secondDatabase = createDatabase();
    databases.set(101, firstDatabase);
    databases.set(202, secondDatabase);

    expect(requireDatabase({ sender: { id: 101 } } as never)).toBe(firstDatabase);
    expect(requireDatabase({ sender: { id: 202 } } as never)).toBe(secondDatabase);
  });

  it('closes and removes a destroyed window database', async () => {
    const database = createDatabase();
    databases.set(101, database);

    await cleanupDatabase(101);

    expect(database.close).toHaveBeenCalledTimes(1);
    expect(databases.has(101)).toBe(false);
    expect(() => requireDatabase({ sender: { id: 101 } } as never)).toThrow('error.databaseNotInitialized');
  });

  it('stops the destroyed window scheduler runtime', async () => {
    const database = createDatabase();
    databases.set(101, database);
    startInvoiceScheduleRuntime(101, database, vi.fn().mockResolvedValue(undefined));

    expect(getInvoiceScheduleRuntimeCount()).toBe(1);

    await cleanupDatabase(101);

    expect(getInvoiceScheduleRuntimeCount()).toBe(0);
  });
});
