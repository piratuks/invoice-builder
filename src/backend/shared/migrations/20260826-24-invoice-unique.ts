import { DatabaseType } from '../enums/databaseType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getDefaultValue } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    if (db.type === DatabaseType.postgre) {
      await db.run(
        'ALTER TABLE invoices DROP CONSTRAINT IF EXISTS "invoices_businessId_invoiceFullNumber_clientId_key"'
      );
      await db.run(
        `ALTER TABLE invoices
         ADD CONSTRAINT invoices_businessId_invoiceFullNumber_clientId_invoiceType_key
         UNIQUE ("businessId", "invoiceFullNumber", "clientId", "invoiceType")`
      );
      return;
    }

    await db.run('DROP TABLE IF EXISTS invoices_new;');
    await db.run(
      `
         CREATE TABLE IF NOT EXISTS invoices_new (
           "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
           "invoiceType" TEXT NOT NULL CHECK("invoiceType" IN ('quotation','invoice')),
           "convertedFromQuotationId" INTEGER,
           "businessId" INTEGER NOT NULL,
           "clientId" INTEGER NOT NULL,
           "currencyId" INTEGER NOT NULL,
           "bankId" INTEGER NULL,
           "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
           "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
           "issuedAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
           "dueDate" ${getColumnType('DATETIME', db.type)},
           "invoiceNumber" TEXT NOT NULL,
           "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK("isArchived" IN (0,1)),
           "status" TEXT NOT NULL DEFAULT 'unpaid' CHECK("status" IN ('unpaid','open','closed','partially','paid')),
           "customerNotes" TEXT,
           "thanksNotes" TEXT,
           "termsConditionNotes" TEXT,
           "discountName" TEXT,
           "discountType" TEXT CHECK("discountType" IN ('fixed','percentage') OR "discountType" IS NULL),
           "discountAmountCents" TEXT NOT NULL DEFAULT '0',
           "discountPercent" REAL NOT NULL DEFAULT 0,
           "surchargeName" TEXT,
           "surchargeType" TEXT CHECK("surchargeType" IN ('fixed','percentage') OR "surchargeType" IS NULL),
           "surchargeAmountCents" TEXT NOT NULL DEFAULT '0',
           "surchargePercent" REAL NOT NULL DEFAULT 0,
           "shippingFeeCents" TEXT NOT NULL DEFAULT '0',
           "invoicePrefix" TEXT,
           "invoiceSuffix" TEXT,
           "taxName" TEXT,
           "taxRate" REAL NOT NULL DEFAULT 0,
           "taxType" TEXT CHECK("taxType" IN ('exclusive','inclusive','deducted') OR "taxType" IS NULL),
           "invoiceFullNumber" TEXT GENERATED ALWAYS AS (
             COALESCE("invoicePrefix", '') || "invoiceNumber" || COALESCE("invoiceSuffix", '')
           ) STORED,
           "language" TEXT NOT NULL DEFAULT 'en',
           "signatureData" ${getColumnType('BLOB', db.type)},
           "signatureName" TEXT,
           "signatureType" TEXT,
           "signatureSize" INTEGER,
           "styleProfilesId" INTEGER,
           "paidAt" ${getColumnType('DATETIME', db.type)},
           "closedAt" ${getColumnType('DATETIME', db.type)},
           FOREIGN KEY("styleProfilesId") REFERENCES style_profiles("id"),
           FOREIGN KEY("businessId") REFERENCES businesses("id"),
           FOREIGN KEY("clientId") REFERENCES clients("id"),
           FOREIGN KEY("currencyId") REFERENCES currencies("id"),
           FOREIGN KEY("convertedFromQuotationId") REFERENCES invoices("id"),
           FOREIGN KEY ("bankId") REFERENCES banks("id"),
           UNIQUE("businessId","invoiceFullNumber", "clientId", "invoiceType"),
           CHECK (
             (
               "discountType" = 'fixed'
               AND CAST("discountAmountCents" AS NUMERIC) >= CAST(0 AS NUMERIC)
               AND "discountPercent" = 0
             ) OR (
               "discountType" = 'percentage'
               AND "discountPercent" BETWEEN 0 AND 100
               AND CAST("discountAmountCents" AS NUMERIC) = CAST(0 AS NUMERIC)
             ) OR (
               "discountType" IS NULL
               AND CAST("discountAmountCents" AS NUMERIC) = CAST(0 AS NUMERIC)
               AND "discountPercent" = 0
             )
           ),
           CHECK("dueDate" IS NULL OR "dueDate" >= "issuedAt"),
           CHECK("convertedFromQuotationId" IS NULL OR "convertedFromQuotationId" != "id")
         );
       `
    );
    await db.run(
      `
         INSERT INTO invoices_new (
           "id",
           "invoiceType",
           "convertedFromQuotationId",
           "businessId",
           "clientId",
           "currencyId",
           "createdAt",
           "updatedAt",
           "issuedAt",
           "dueDate",
           "invoiceNumber",
           "isArchived",
           "status",
           "customerNotes",
           "thanksNotes",
           "termsConditionNotes",
           "discountName",
           "discountType",
           "discountAmountCents",
           "discountPercent",
           "shippingFeeCents",
           "invoicePrefix",
           "invoiceSuffix",
           "taxName",
           "taxRate",
           "taxType",
           "language",
           "signatureData",
           "signatureName",
           "signatureType",
           "signatureSize",
           "styleProfilesId",
           "paidAt",
           "closedAt"
         )
         SELECT
           i."id",
           i."invoiceType",
           i."convertedFromQuotationId",
           i."businessId",
           i."clientId",
           i."currencyId",
           i."createdAt",
           i."updatedAt",
           i."issuedAt",
           i."dueDate",
           i."invoiceNumber",
           i."isArchived",
           i."status",
           i."customerNotes",
           i."thanksNotes",
           i."termsConditionNotes",
           i."discountName",
           i."discountType",
           i."discountAmountCents",
           i."discountPercent",
           i."shippingFeeCents",
           i."invoicePrefix",
           i."invoiceSuffix",
           i."taxName",
           i."taxRate",
           i."taxType",
           i."language",
           i."signatureData",
           i."signatureName",
           i."signatureType",
           i."signatureSize",
           i."styleProfilesId",
           i."paidAt",
           i."closedAt"
         FROM invoices as i;
         `
    );
    await db.run('DROP TABLE invoices;');
    await db.run('ALTER TABLE invoices_new RENAME TO invoices;');
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_bankId ON invoices("bankId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_clientId ON invoices("clientId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_businessId ON invoices("businessId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_business_client ON invoices("businessId", "clientId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices("invoiceType")`);
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoices_convertedFromQuotationId ON invoices("convertedFromQuotationId")`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_invoiceNumber ON invoices("invoiceNumber")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices("status")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_issuedAt ON invoices("issuedAt")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_styleProfilesId ON invoices("styleProfilesId")`);
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
