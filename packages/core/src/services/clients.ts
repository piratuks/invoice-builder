import type { Client, ClientAdd, ClientUpdate, FilterData, Response } from '@invoice-builder/contracts';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithCounts } from '../types/entityWithCounts';
import { getAllEntities, handleEntity } from '../utils/entitiesFunctions';
import { mapDatabaseError } from '../utils/errorFunctions';

const clientFields: (keyof Client)[] = [
  'name',
  'shortName',
  'address',
  'email',
  'phone',
  'code',
  'additional',
  'description',
  'vatCode',
  'peppolEndpointId',
  'countryCode',
  'peppolEndpointSchemeId',
  'buyerReference',
  'isArchived'
];

export const getAllClients = async (
  db: DatabaseAdapter,
  filter?: FilterData[]
): Promise<Response<(Client & EntityWithCounts)[]>> => {
  const getAll = getAllEntities<Client>(db, 'clients', 't', 'i', {
    joins: `
        LEFT JOIN invoices i ON i."clientId" = t."id"
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

export const addClient = async (db: DatabaseAdapter, data: ClientAdd): Promise<Response<Client & EntityWithCounts>> => {
  const handle = handleEntity<Client>(db, 'clients', 'c', clientFields, {
    joins: `LEFT JOIN invoices i ON i."clientId" = c."id"`,
    invoiceCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'invoice'
           THEN i.id END)
       `,
    quotesCountExpr: `
         COUNT(DISTINCT CASE WHEN i."invoiceType" = 'quotation'
           THEN i."id" END)
       `
  });
  return handle(data);
};

export const updateClient = async (
  db: DatabaseAdapter,
  data: ClientUpdate
): Promise<Response<Client & EntityWithCounts>> => {
  const handle = handleEntity<Client>(db, 'clients', 'c', clientFields, {
    joins: `LEFT JOIN invoices i ON i."clientId" = c.id`,
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

export const deleteClient = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM clients WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const batchAddClient = async (db: DatabaseAdapter, data: ClientAdd[]) => {
  const handle = handleEntity<Client>(db, 'clients', 'c', clientFields, {
    joins: `LEFT JOIN invoices i ON i."clientId" = c."id"`,
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
