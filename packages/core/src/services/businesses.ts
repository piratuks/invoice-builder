import type { Business, BusinessAdd, BusinessUpdate, FilterData, Response } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithCounts } from '../types/entityWithCounts';
import { getAllEntities, handleEntity } from '../utils/entitiesFunctions';
import { mapDatabaseError } from '../utils/errorFunctions';

const businessFields: (keyof Business)[] = [
  'name',
  'shortName',
  'address',
  'role',
  'email',
  'phone',
  'website',
  'additional',
  // Legacy payment info. New payment info is via Bank
  // 'paymentInformation',
  'logo',
  'fileSize',
  'fileType',
  'fileName',
  'description',
  'vatCode',
  'peppolEndpointId',
  'countryCode',
  'code',
  'peppolEndpointSchemeId',
  'isArchived'
];

export const getAllBusinesses = (
  db: DatabaseAdapter,
  filter?: FilterData[]
): Promise<Response<(Business & EntityWithCounts)[]>> => {
  const getAll = getAllEntities<Business>(db, 'businesses', 't', 'i', {
    joins: `
      LEFT JOIN invoices i ON i."businessId" = t."id"
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

export const addBusiness = (db: DatabaseAdapter, data: BusinessAdd): Promise<Response<Business & EntityWithCounts>> => {
  const handle = handleEntity<Business>(db, 'businesses', 'b', businessFields, {
    joins: `LEFT JOIN invoices i ON i."businessId" = b.id`,
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

export const updateBusiness = (
  db: DatabaseAdapter,
  data: BusinessUpdate
): Promise<Response<Business & EntityWithCounts>> => {
  const handle = handleEntity<Business>(db, 'businesses', 'b', businessFields, {
    joins: `LEFT JOIN invoices i ON i."businessId" = b."id"`,
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

export const deleteBusiness = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM businesses WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddBusiness = async (db: DatabaseAdapter, data: BusinessAdd[]) => {
  const handle = handleEntity<Business>(db, 'businesses', 'b', businessFields, {
    joins: `LEFT JOIN invoices i ON i."businessId" = b."id"`,
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
