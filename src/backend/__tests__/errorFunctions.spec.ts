import { DatabaseType } from '../shared/enums/databaseType';
import { isDatabaseError, mapDatabaseError } from '../shared/utils/errorFunctions';

describe('isDatabaseError', () => {
  it('identifies errors with a string code', () => {
    const error = Object.assign(new Error('boom'), { code: 'SQLITE_ERROR' });
    expect(isDatabaseError(error)).toBe(true);
  });

  it('rejects errors without a code or non-errors', () => {
    expect(isDatabaseError(new Error('boom'))).toBe(false);
    expect(isDatabaseError('boom')).toBe(false);
    expect(isDatabaseError(undefined)).toBe(false);
  });
});

describe('mapDatabaseError', () => {
  it('maps known sqlite error snippets', () => {
    const cases: Array<[string, string]> = [
      ['UNIQUE constraint failed: banks.name', 'error.invalidConstraintUnique'],
      ['FOREIGN KEY constraint failed', 'error.invalidConstraintForeign'],
      ['CHECK constraint failed: isArchived', 'error.invalidConstraintCheck'],
      ['NOT NULL constraint failed: banks.name', 'error.invalidConstraintNotNull'],
      ['datatype mismatch', 'error.datatypeMismatch'],
      ['database is locked', 'error.databaseLocked'],
      ['file is not a database', 'error.databaseCorrupt']
    ];

    for (const [message, key] of cases) {
      const error = Object.assign(new Error(message), { code: 'SQLITE_CONSTRAINT' });
      expect(mapDatabaseError(error, DatabaseType.sqlite)).toEqual({ key });
    }
  });

  it('maps sqlite error codes directly', () => {
    const error = Object.assign(new Error('SQLITE_IOERR: io failure'), { code: 'SQLITE_IOERR' });
    expect(mapDatabaseError(error, DatabaseType.sqlite)).toEqual({ key: 'error.diskIOError' });
  });

  it('falls back to unknownError for unmapped sqlite messages', () => {
    const error = Object.assign(new Error('something odd'), { code: 'SQLITE_MISC' });
    expect(mapDatabaseError(error, DatabaseType.sqlite)).toEqual({
      key: 'error.unknownError',
      message: 'something odd'
    });
  });

  it('maps known postgres error codes', () => {
    const cases: Array<[string, string]> = [
      ['23505', 'error.invalidConstraintUnique'],
      ['23503', 'error.invalidConstraintForeign'],
      ['23502', 'error.invalidConstraintNotNull'],
      ['23514', 'error.invalidConstraintCheck'],
      ['42601', 'error.sqlSyntaxError'],
      ['22P02', 'error.datatypeMismatch']
    ];

    for (const [code, key] of cases) {
      const error = Object.assign(new Error('pg error'), { code });
      expect(mapDatabaseError(error, DatabaseType.postgre)).toEqual({ key });
    }
  });

  it('falls back to unknownError for unmapped postgres codes', () => {
    const error = Object.assign(new Error('pg error'), { code: '99999' });
    expect(mapDatabaseError(error, DatabaseType.postgre)).toEqual({ key: 'error.unknownError', message: 'pg error' });
  });

  it('maps well-known Error messages without a code', () => {
    expect(mapDatabaseError(new Error('Database file does not exist'), DatabaseType.sqlite)).toEqual({
      key: 'error.databaseFileMissing'
    });
    expect(mapDatabaseError(new Error('EBUSY: resource busy'), DatabaseType.sqlite)).toEqual({
      key: 'error.databaseIsBusy'
    });
    expect(mapDatabaseError(new Error('totally unexpected'), DatabaseType.sqlite)).toEqual({
      key: 'error.unknownError',
      message: 'totally unexpected'
    });
  });

  it('handles non-Error values', () => {
    expect(mapDatabaseError('plain string error', DatabaseType.sqlite)).toEqual({
      key: 'error.unknownError',
      message: 'plain string error'
    });
  });
});
