import type { Currency, CurrencyAdd, CurrencyUpdate, FilterData, Response } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithCounts } from '../types/entityWithCounts';
import { getAllEntities, handleEntity } from '../utils/entitiesFunctions';
import { mapDatabaseError } from '../utils/errorFunctions';

const currencyFields: (keyof Currency)[] = ['code', 'symbol', 'text', 'format', 'isArchived', 'subunit'];

export const getAllCurrencies = async (
  db: DatabaseAdapter,
  filter?: FilterData[]
): Promise<Response<(Currency & EntityWithCounts)[]>> => {
  const getAll = getAllEntities<Currency>(db, 'currencies', 't', 'i', {
    joins: `
        LEFT JOIN invoices i ON i."currencyId" = t."id"
      `,
    invoiceCountExpr: `
        COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
          THEN i."id" END)
      `,
    quotesCountExpr: `
        COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
          THEN i."id" END)
      `
  });
  return getAll(filter ?? []);
};

export const addCurrency = async (
  db: DatabaseAdapter,
  data: CurrencyAdd
): Promise<Response<Currency & EntityWithCounts>> => {
  const handle = handleEntity<Currency>(db, 'currencies', 'c', currencyFields, {
    joins: `LEFT JOIN invoices i ON i."currencyId" = c."id"`,
    invoiceCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
           THEN i."id" END)
       `,
    quotesCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
           THEN i."id" END)
       `
  });
  return handle(data);
};

export const updateCurrency = async (
  db: DatabaseAdapter,
  data: CurrencyUpdate
): Promise<Response<Currency & EntityWithCounts>> => {
  const handle = handleEntity<Currency>(db, 'currencies', 'c', currencyFields, {
    joins: `LEFT JOIN invoices i ON i."currencyId" = c."id"`,
    invoiceCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
           THEN i."id" END)
       `,
    quotesCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
           THEN i."id" END)
       `
  });
  return handle(data, true);
};

export const deleteCurrency = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM currencies WHERE id = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddCurrency = async (db: DatabaseAdapter, data: CurrencyAdd[]) => {
  const handle = handleEntity<Currency>(db, 'currencies', 'c', currencyFields, {
    joins: `LEFT JOIN invoices i ON i."currencyId" = c."id"`,
    invoiceCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
           THEN i."id" END)
       `,
    quotesCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
           THEN i."id" END)
       `
  });
  try {
    await db.run('BEGIN');
    for (const row of data) {
      const result = await handle(row);
      if (!result.success) {
        try {
          await db.run('ROLLBACK');
        } catch {
          throw new Error(`error.rollbackFailed`);
        }
        return result;
      }
    }
    await db.run('COMMIT');
    return { success: true };
  } catch (error) {
    try {
      await db.run('ROLLBACK');
    } catch {
      throw new Error(`error.rollbackFailed`);
    }
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
