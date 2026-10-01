import { DatabaseType } from '@invoice-builder/contracts';
import type { DatabaseError } from '../types/databaseError';

const sqliteErrorMap: Record<string, string> = {
  'UNIQUE constraint failed': 'error.invalidConstraintUnique',
  'FOREIGN KEY constraint failed': 'error.invalidConstraintForeign',
  'CHECK constraint failed': 'error.invalidConstraintCheck',
  'NOT NULL constraint failed': 'error.invalidConstraintNotNull',
  'datatype mismatch': 'error.datatypeMismatch',
  'database is locked': 'error.databaseLocked',
  'file is not a database': 'error.databaseCorrupt',
  SQLITE_ERROR: 'error.sqlSyntaxError',
  SQLITE_IOERR: 'error.diskIOError'
};

const postgresErrorMap: Record<string, string> = {
  '23505': 'error.invalidConstraintUnique',
  '23503': 'error.invalidConstraintForeign',
  '23502': 'error.invalidConstraintNotNull',
  '23514': 'error.invalidConstraintCheck',
  '42601': 'error.sqlSyntaxError',
  '22P02': 'error.datatypeMismatch'
};

export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return error instanceof Error && typeof (error as unknown as { code?: string }).code === 'string';
};

export const mapDatabaseError = (error: unknown, dbType: DatabaseType): { key: string; message?: string } => {
  if (isDatabaseError(error)) {
    if (dbType === DatabaseType.sqlite) {
      for (const [snippet, key] of Object.entries(sqliteErrorMap)) {
        if (error.message.includes(snippet)) {
          return { key };
        }
      }
    }

    if (dbType === DatabaseType.postgre) {
      const mapped = postgresErrorMap[error.code];
      if (mapped) return { key: mapped };
    }

    return { key: 'error.unknownError', message: error.message };
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('Database file does not exist')) return { key: 'error.databaseFileMissing' };
    if (msg.includes('EBUSY')) return { key: 'error.databaseIsBusy' };
    return { key: 'error.unknownError', message: msg };
  }
  return { key: 'error.unknownError', message: String(error) };
};
