import { DatabaseType } from '../shared/enums/databaseType';
import type { DatabaseAdapter } from '../shared/types/DatabaseAdapter';
import {
  boolToInt,
  convertBooleanFields,
  convertBooleanFieldsArray,
  convertBooleanFieldsToInt,
  convertBooleanFieldsToIntArray,
  convertDateFields,
  convertDateFieldsArray,
  getColumnType,
  getDefaultValue,
  getTableColumns,
  insertOrIgnore,
  isTableExists,
  prepareUpdate,
  toDbValue
} from '../shared/utils/dbHelper';
import { createTestDatabase } from './testDb';

describe('boolToInt', () => {
  it('converts booleans to 0/1 and passes through other values', () => {
    expect(boolToInt(true)).toBe(1);
    expect(boolToInt(false)).toBe(0);
    expect(boolToInt('foo')).toBe('foo');
    expect(boolToInt(5)).toBe(5);
  });
});

describe('convertBooleanFieldsToInt(Array)', () => {
  it('converts known boolean fields to integers', () => {
    const result = convertBooleanFieldsToInt({ isArchived: true, name: 'x' });
    expect(result).toEqual({ isArchived: 1, name: 'x' });
  });

  it('handles arrays', () => {
    const result = convertBooleanFieldsToIntArray([{ isArchived: false }, { isArchived: true }]);
    expect(result).toEqual([{ isArchived: 0 }, { isArchived: 1 }]);
  });
});

describe('convertDateFields(Array)', () => {
  it('converts Date instances to sqlite-friendly strings', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    const result = convertDateFields({ createdAt: date, name: 'x' });
    expect(result.createdAt).toBe('2024-01-15 10:30:00.000');
    expect(result.name).toBe('x');
  });

  it('leaves non-date values untouched', () => {
    const result = convertDateFields({ createdAt: '2024-01-01', updatedAt: null });
    expect(result.createdAt).toBe('2024-01-01');
    expect(result.updatedAt).toBeNull();
  });

  it('handles arrays', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    const result = convertDateFieldsArray([{ createdAt: date }]);
    expect(result[0].createdAt).toBe('2024-01-15 10:30:00.000');
  });
});

describe('convertBooleanFields(Array)', () => {
  it('converts stored integers back to booleans', () => {
    const result = convertBooleanFields({ isArchived: 1, name: 'x' });
    expect(result).toEqual({ isArchived: true, name: 'x' });
  });

  it('handles arrays', () => {
    const result = convertBooleanFieldsArray([{ isArchived: 0 }, { isArchived: 1 }]);
    expect(result).toEqual([{ isArchived: false }, { isArchived: true }]);
  });
});

describe('prepareUpdate', () => {
  it('builds fields/params, skipping undefined values', () => {
    const { fields, params } = prepareUpdate({
      name: 'foo',
      isArchived: true,
      note: undefined,
      count: 5
    } as unknown as Parameters<typeof prepareUpdate>[0]);
    expect(fields).toEqual(['"name" = ?', '"isArchived" = ?', '"count" = ?']);
    expect(params).toEqual(['foo', 1, 5]);
  });

  it('appends the id when provided', () => {
    const { params } = prepareUpdate({ name: 'foo' }, 42);
    expect(params).toEqual(['foo', 42]);
  });

  it('supports explicit null values', () => {
    const { params } = prepareUpdate({ note: null });
    expect(params).toEqual([null]);
  });

  it('throws for unsupported value types', () => {
    expect(() => prepareUpdate({ bad: {} as unknown as string })).toThrow('error.unsupportedValue');
  });
});

describe('getColumnType', () => {
  it('maps sqlite types to postgres equivalents', () => {
    expect(getColumnType('DATETIME', DatabaseType.postgre)).toBe('TIMESTAMP');
    expect(getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', DatabaseType.postgre)).toBe(
      'INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY'
    );
    expect(getColumnType('BLOB', DatabaseType.postgre)).toBe('BYTEA');
    expect(getColumnType('TEXT', DatabaseType.postgre)).toBe('TEXT');
  });

  it('returns sqlite type unchanged for sqlite', () => {
    expect(getColumnType('DATETIME', DatabaseType.sqlite)).toBe('DATETIME');
  });
});

describe('getDefaultValue', () => {
  it('maps sqlite date expressions to postgres equivalents', () => {
    expect(getDefaultValue("datetime('now', '-30 days')", DatabaseType.postgre)).toBe("NOW() - INTERVAL '30 days'");
    expect(getDefaultValue("datetime('now', '-60 days')", DatabaseType.postgre)).toBe("NOW() - INTERVAL '60 days'");
    expect(getDefaultValue("datetime('now', '-90 days')", DatabaseType.postgre)).toBe("NOW() - INTERVAL '90 days'");
    expect(getDefaultValue("date('now','start of month','+2 months','-1 day')", DatabaseType.postgre)).toBe(
      "DATE_TRUNC('month', NOW()) + INTERVAL '2 month' - INTERVAL '1 day'"
    );
    expect(getDefaultValue("(datetime('now'))", DatabaseType.postgre)).toBe('NOW()');
    expect(getDefaultValue("datetime('now')", DatabaseType.postgre)).toBe('NOW()');
    expect(getDefaultValue('unknown-expr', DatabaseType.postgre)).toBe('unknown-expr');
  });

  it('returns the sqlite expression unchanged for sqlite', () => {
    expect(getDefaultValue("datetime('now')", DatabaseType.sqlite)).toBe("datetime('now')");
  });
});

describe('insertOrIgnore', () => {
  it('builds a sqlite insert with default values when no columns', () => {
    expect(insertOrIgnore('settings', [], [[]], DatabaseType.sqlite)).toBe(
      'INSERT OR IGNORE INTO settings DEFAULT VALUES;'
    );
  });

  it('throws for postgres without a conflict target and no columns', () => {
    expect(() => insertOrIgnore('settings', [], [[]], DatabaseType.postgre)).toThrow('error.postgresConflictTarget');
  });

  it('builds a postgres insert with default values and conflict target', () => {
    expect(insertOrIgnore('settings', [], [[]], DatabaseType.postgre, 'id')).toBe(
      'INSERT INTO settings DEFAULT VALUES ON CONFLICT (id) DO NOTHING;'
    );
  });

  it('builds a sqlite insert with columns and values', () => {
    const sql = insertOrIgnore('currencies', ['code', 'symbol'], [['USD', '$']], DatabaseType.sqlite);
    expect(sql).toBe(`INSERT OR IGNORE INTO currencies ("code", "symbol") VALUES ('USD', '$');`);
  });

  it('throws for postgres with columns but no conflict target', () => {
    expect(() => insertOrIgnore('currencies', ['code'], [['USD']], DatabaseType.postgre)).toThrow(
      'error.postgresConflictTarget'
    );
  });

  it('builds a postgres insert with columns and conflict target', () => {
    const sql = insertOrIgnore('currencies', ['code'], [['USD']], DatabaseType.postgre, 'code');
    expect(sql).toBe(`INSERT INTO currencies ("code") VALUES ('USD') ON CONFLICT (code) DO NOTHING;`);
  });
});

describe('toDbValue', () => {
  it('normalizes primitives and objects', () => {
    expect(toDbValue(undefined)).toBeNull();
    expect(toDbValue(null)).toBeNull();
    expect(toDbValue('x')).toBe('x');
    expect(toDbValue(5)).toBe(5);
    expect(toDbValue(true)).toBe(true);
    expect(toDbValue({ a: 1 })).toBe('{"a":1}');
  });

  it('passes buffers through unchanged', () => {
    const buf = Buffer.from('hello');
    expect(toDbValue(buf)).toBe(buf);
  });
});

describe('db-backed helpers', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('isTableExists reports existing and missing tables', async () => {
    expect(await isTableExists(db, 'settings')).toBe(true);
    expect(await isTableExists(db, 'does_not_exist')).toBe(false);
  });

  it('getTableColumns returns column metadata', async () => {
    const columns = await getTableColumns(db, 'settings');
    expect(columns.some(c => c.name === 'language')).toBe(true);
  });
});
