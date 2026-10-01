import type { Bank, BankAdd, BankUpdate, FilterData, Response } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithCounts } from '../types/entityWithCounts';
import { getAllEntities, handleEntity } from '../utils/entitiesFunctions';
import { mapDatabaseError } from '../utils/errorFunctions';

const bankFields: (keyof Bank)[] = [
  'name',
  'bankName',
  'accountNumber',
  'swiftCode',
  'address',
  'branchCode',
  'type',
  'routingNumber',
  'accountHolder',
  'sortOrder',
  'upiCode',
  'qrCode',
  'qrCodeFileSize',
  'qrCodeFileType',
  'qrCodeFileName',
  'isArchived'
];

export const getAllBanks = async (
  db: DatabaseAdapter,
  filter?: FilterData[]
): Promise<Response<(Bank & EntityWithCounts)[]>> => {
  const getAll = getAllEntities<Bank>(db, 'banks', 'b', 'i', {
    joins: `
          LEFT JOIN invoices i ON i."bankId" = b."id"
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

export const addBank = async (db: DatabaseAdapter, data: BankAdd): Promise<Response<Bank & EntityWithCounts>> => {
  const handle = handleEntity<Bank>(db, 'banks', 'b', bankFields, {
    joins: `LEFT JOIN invoices i ON i."bankId" = b."id"`,
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

export const updateBank = async (db: DatabaseAdapter, data: BankUpdate): Promise<Response<Bank & EntityWithCounts>> => {
  const handle = handleEntity<Bank>(db, 'banks', 'b', bankFields, {
    joins: `LEFT JOIN invoices i ON i."bankId" = b."id"`,
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

export const deleteBank = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM banks WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddBank = async (db: DatabaseAdapter, data: BankAdd[]) => {
  const handle = handleEntity<Bank>(db, 'banks', 'b', bankFields, {
    joins: `LEFT JOIN invoices i ON i."bankId" = b."id"`,
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
