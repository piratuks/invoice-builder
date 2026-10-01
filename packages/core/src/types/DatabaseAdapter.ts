import type { DatabaseType } from '@invoice-builder/contracts';

export type DatabaseAdapter = {
  type: DatabaseType;
  run: (sql: string, params?: unknown[], returningId?: boolean) => Promise<number>;
  get: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T | null>;
  all: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  close: () => Promise<void>;
};
