import { DatabaseType } from '../enums/databaseType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getDefaultValue } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    if (db.type === DatabaseType.postgre) {
      await db.run(
        `ALTER TABLE invoice_sequences
         ADD COLUMN "invoiceType" TEXT NOT NULL DEFAULT 'invoice'
         CHECK("invoiceType" IN ('quotation','invoice'))`
      );
      await db.run(
        'ALTER TABLE invoice_sequences DROP CONSTRAINT IF EXISTS "invoice_sequences_businessId_clientId_key"'
      );
      await db.run(
        `ALTER TABLE invoice_sequences
         ADD CONSTRAINT invoice_sequences_business_client_type_unique
         UNIQUE ("businessId", "clientId", "invoiceType")`
      );
      return;
    }

    await db.run('DROP TABLE IF EXISTS invoice_sequences_new;');

    await db.run(
      `
      CREATE TABLE invoice_sequences_new (
        "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
        "businessId" INTEGER NOT NULL,
        "clientId" INTEGER NOT NULL,
        "nextSequence" BIGINT NOT NULL,
        "invoiceType" TEXT NOT NULL CHECK("invoiceType" IN ('quotation','invoice')),
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        UNIQUE("businessId","clientId","invoiceType")
      );
      `
    );

    await db.run(
      `
      INSERT INTO invoice_sequences_new ("id", "businessId", "clientId", "nextSequence", "invoiceType", "createdAt", "updatedAt")
      SELECT
        "id", "businessId", "clientId", "nextSequence", 'invoice', "createdAt", "updatedAt"
      FROM invoice_sequences
      `
    );

    await db.run('DROP TABLE invoice_sequences;');
    await db.run('ALTER TABLE invoice_sequences_new RENAME TO invoice_sequences;');
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
