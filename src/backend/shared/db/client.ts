import { Pool, type PoolClient, type PoolConfig } from 'pg';
import sqlite3 from 'sqlite3';
import { DatabaseType } from '../enums/databaseType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import {
  boolToInt,
  convertBooleanFields,
  convertBooleanFieldsArray,
  convertDateFields,
  convertDateFieldsArray
} from '../utils/dbHelper';

const convertQuestionToDollar = (sql: string) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

export const createSqliteAdapter = (db: sqlite3.Database): DatabaseAdapter => {
  return {
    type: DatabaseType.sqlite,
    run: (sql: string, params: unknown[] = [], returningId = false) =>
      new Promise<number>((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve(returningId ? this.lastID : -1);
        });
      }),
    get: <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
      new Promise<T | null>((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          const convertedRow = convertBooleanFields(row as Record<string, unknown>);
          resolve(convertedRow as T);
        });
      }),
    all: <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
      new Promise<T[]>((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          const convertedRows = convertBooleanFieldsArray(rows as Record<string, unknown>[]);
          resolve(convertedRows as T[]);
        });
      }),
    query: async (sql: string, params: unknown[] = []) => {
      const rows = await new Promise<unknown[]>((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          const convertedRows = convertBooleanFieldsArray(rows as Record<string, unknown>[]);
          resolve(convertedRows);
        });
      });
      return { rows };
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        (db as sqlite3.Database).close(err => (err ? reject(err) : resolve()));
      })
  };
};

export type PostgresPoolOptions = Pick<
  PoolConfig,
  'max' | 'idleTimeoutMillis' | 'connectionTimeoutMillis' | 'maxLifetimeSeconds' | 'allowExitOnIdle'
>;

const getDefaultPostgresPoolOptions = (): PostgresPoolOptions => ({
  max: Number(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.PG_POOL_IDLE_TIMEOUT_MS) || 30_000,
  connectionTimeoutMillis: Number(process.env.PG_POOL_CONNECTION_TIMEOUT_MS) || 5_000,
  maxLifetimeSeconds: Number(process.env.PG_POOL_MAX_LIFETIME_SECONDS) || 0,
  allowExitOnIdle: process.env.PG_POOL_ALLOW_EXIT_ON_IDLE === 'true'
});

export const createPostgresAdapter = (
  connectionString: string,
  options: Partial<PostgresPoolOptions> = {}
): DatabaseAdapter => {
  const pool = new Pool({ connectionString, ...getDefaultPostgresPoolOptions(), ...options });
  if (typeof pool.on === 'function') {
    pool.on('error', error => {
      console.error('PostgreSQL pool error:', error);
    });
  }
  let clientInTransaction: PoolClient | null = null;
  let closePromise: Promise<void> | null = null;

  const acquireClient = async () => {
    if (clientInTransaction) return clientInTransaction;
    clientInTransaction = await pool.connect();
    return clientInTransaction;
  };

  const releaseClient = async () => {
    if (clientInTransaction) {
      try {
        clientInTransaction.release();
      } catch {
        throw new Error(`error.failedPGrelease`);
      }

      clientInTransaction = null;
    }
  };

  const runQuery = async (sql: string, params: unknown[] = []) => {
    const text = convertQuestionToDollar(sql);
    const trimmed = text.trim().toUpperCase();
    if (trimmed === 'BEGIN' || trimmed.startsWith('BEGIN ')) {
      const client = await acquireClient();
      await client.query(text, params);
      return { rows: [], rowCount: 0 };
    }
    if (trimmed === 'COMMIT' || trimmed === 'ROLLBACK') {
      if (!clientInTransaction) {
        return { rows: [], rowCount: 0 };
      }
      try {
        const res = await clientInTransaction.query(text, params);
        return res;
      } finally {
        await releaseClient();
      }
    }

    if (clientInTransaction) {
      return clientInTransaction.query(text, params);
    }

    return pool.query(text, params);
  };

  return {
    type: DatabaseType.postgre,
    run: async (sql: string, params: unknown[] = [], returningId = false) => {
      const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
      const isUpdate = sql.trim().toUpperCase().startsWith('UPDATE');
      if (returningId && isInsert && !sql.toUpperCase().includes('RETURNING')) {
        sql += ' RETURNING id';
      }

      if (isInsert || isUpdate) {
        params = params.map(boolToInt);
      }

      const res = await runQuery(sql, params);
      if (isInsert && returningId) {
        return res.rows[0]?.id ?? -1;
      }
      return res.rowCount ?? 0;
    },
    get: async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => {
      const res = await runQuery(sql, params);
      if (!res.rows[0]) return null;
      const convertedBooleanRow = convertBooleanFields(res.rows[0] as Record<string, unknown>);
      const convertedDateRow = convertDateFields(convertedBooleanRow as Record<string, unknown>);

      return convertedDateRow as T;
    },
    all: async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => {
      const res = await runQuery(sql, params);
      const convertedBooleanRow = convertBooleanFieldsArray(res.rows as Record<string, unknown>[]);
      const convertedDateRow = convertDateFieldsArray(convertedBooleanRow as Record<string, unknown>[]);

      return convertedDateRow as T[];
    },
    query: async (sql: string, params: unknown[] = []) => {
      const res = await runQuery(sql, params);
      const convertedBooleanRow = convertBooleanFieldsArray(res.rows as Record<string, unknown>[]);
      const convertedDateRow = convertDateFieldsArray(convertedBooleanRow as Record<string, unknown>[]);

      return { rows: convertedDateRow };
    },
    close: async () => {
      if (!closePromise) {
        closePromise = (async () => {
          await releaseClient();
          await pool.end();
        })();
      }
      await closePromise;
    }
  };
};
