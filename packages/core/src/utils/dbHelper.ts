import { BOOLEAN_FIELDS, DATE_FIELDS } from '../constant';
import { DatabaseType } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { DbValue } from '../types/dbValue';
import type { TableColumn } from '../types/tableColumn';
import type { UpdateData } from '../types/updateData';

export const boolToInt = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return value;
};

export const convertBooleanFieldsToIntArray = <T extends Record<string, unknown>>(rows: T[]): T[] =>
  rows.map(convertBooleanFieldsToInt);

export const convertBooleanFieldsToInt = <T extends Record<string, unknown>>(row: T): T => {
  const converted = { ...row } as Record<string, unknown>;

  BOOLEAN_FIELDS.forEach(key => {
    if (key in converted) {
      const value = converted[key];

      converted[key] = boolToInt(value);
    }
  });

  return converted as T;
};

export const convertDateFields = <T extends Record<string, unknown>>(row: T): T => {
  const convertedRow = { ...row } as Record<string, unknown>;

  DATE_FIELDS.forEach(key => {
    if (key in convertedRow && convertedRow[key] != null) {
      const value = convertedRow[key];

      if (value instanceof Date) {
        convertedRow[key] = value.toISOString().replace('T', ' ').replace('Z', '');
      }
    }
  });

  return convertedRow as T;
};

export const convertDateFieldsArray = <T extends Record<string, unknown>>(rows: T[]): T[] =>
  rows.map(convertDateFields);

export const convertBooleanFields = <T extends Record<string, unknown>>(row: T): T => {
  const convertedRow = { ...row } as Record<string, unknown>;

  BOOLEAN_FIELDS.forEach(key => {
    if (key in convertedRow) {
      convertedRow[key] = Boolean(convertedRow[key]);
    }
  });

  return convertedRow as T;
};

export const convertBooleanFieldsArray = <T extends Record<string, unknown>>(rows: T[]): T[] =>
  rows.map(convertBooleanFields);

export const prepareUpdate = (data: UpdateData, id?: number) => {
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`"${key}" = ?`);

      let param: string | number | null;

      if (typeof value === 'boolean') param = value ? 1 : 0;
      else if (value === null) param = null;
      else if (typeof value === 'string' || typeof value === 'number') param = value;
      else throw new Error(`error.unsupportedValue`);

      params.push(param);
    }
  });

  if (id != null) params.push(id);

  return { fields, params };
};

export const getColumnType = (sqliteType: string, dbType: DatabaseType) => {
  if (dbType === DatabaseType.postgre) {
    switch (sqliteType) {
      case 'DATETIME':
        return 'TIMESTAMP';
      case 'INTEGER PRIMARY KEY AUTOINCREMENT':
        return 'INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY';
      case 'BLOB':
        return 'BYTEA';
      default:
        return sqliteType;
    }
  }
  return sqliteType;
};

export const getDefaultValue = (sqliteExpr: string, dbType: DatabaseType) => {
  if (dbType === DatabaseType.postgre) {
    switch (sqliteExpr) {
      case "datetime('now', '-30 days')":
        return "NOW() - INTERVAL '30 days'";
      case "datetime('now', '-60 days')":
        return "NOW() - INTERVAL '60 days'";
      case "datetime('now', '-90 days')":
        return "NOW() - INTERVAL '90 days'";
      case "date('now','start of month','+2 months','-1 day')":
        return "DATE_TRUNC('month', NOW()) + INTERVAL '2 month' - INTERVAL '1 day'";
      case "(datetime('now'))":
        return 'NOW()';
      case "datetime('now')":
        return 'NOW()';
      default:
        return sqliteExpr;
    }
  }
  return sqliteExpr;
};

export const insertOrIgnore = (
  table: string,
  columns: string[],
  values: string[][],
  dbType: DatabaseType,
  conflictTarget?: string
) => {
  if (columns.length === 0) {
    if (dbType === DatabaseType.sqlite) {
      return `INSERT OR IGNORE INTO ${table} DEFAULT VALUES;`;
    } else {
      if (!conflictTarget) {
        throw new Error(`error.postgresConflictTarget`);
      }
      return `INSERT INTO ${table} DEFAULT VALUES ON CONFLICT (${conflictTarget}) DO NOTHING;`;
    }
  }

  const columnsList = columns.map(c => `"${c}"`).join(', ');
  const valuesList = values.map(v => `(${v.map(val => `'${val}'`).join(', ')})`).join(',\n  ');

  if (dbType === DatabaseType.sqlite) {
    return `INSERT OR IGNORE INTO ${table} (${columnsList}) VALUES ${valuesList};`;
  } else {
    if (!conflictTarget) {
      throw new Error(`error.postgresConflictTarget`);
    }
    return `INSERT INTO ${table} (${columnsList}) VALUES ${valuesList} ON CONFLICT (${conflictTarget}) DO NOTHING;`;
  }
};

export const isTableExists = async (db: DatabaseAdapter, tableName: string): Promise<boolean> => {
  if (db.type === DatabaseType.sqlite) {
    const row = await db.get<{ name: string }>(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
      `,
      [tableName]
    );
    return !!row;
  }
  if (db.type === DatabaseType.postgre) {
    const row = await db.get<{ table_name: string }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ?
      `,
      [tableName]
    );
    return !!row;
  }

  return false;
};

export const getTableColumns = async (db: DatabaseAdapter, tableName: string): Promise<TableColumn[]> => {
  if (db.type === DatabaseType.sqlite) {
    const rows = await db.all<TableColumn>(
      `
      SELECT *
      FROM pragma_table_info('${tableName}')
    `
    );
    return rows;
  }
  if (db.type === DatabaseType.postgre) {
    const rows = await db.all<TableColumn>(
      `SELECT column_name AS name, 
      data_type AS type
      FROM information_schema.columns WHERE table_name = ?`,
      [tableName]
    );
    return rows;
  }

  return [];
};

export const toDbValue = (value: unknown): DbValue => {
  if (value === undefined || value === null) return null;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;

  return JSON.stringify(value);
};
