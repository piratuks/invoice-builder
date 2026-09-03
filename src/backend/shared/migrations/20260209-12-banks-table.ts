import { DatabaseType } from '../enums/databaseType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType, getDefaultValue, isTableExists } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    const isExisting = await isTableExists(db, 'banks');
    if (isExisting) return;

    await db.run(
      `CREATE TABLE IF NOT EXISTS banks (
        "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
        "name" TEXT NOT NULL UNIQUE,
        "bankName" TEXT,
        "accountNumber" TEXT,
        "swiftCode" TEXT,
        "address" TEXT,
        "branchCode" TEXT,
        "type" TEXT,
        "routingNumber" TEXT,
        "upiCode" TEXT,
        "qrCode" ${getColumnType('BLOB', db.type)},
        "qrCodeFileSize" INTEGER,
        "qrCodeFileType" TEXT,
        "qrCodeFileName" TEXT,
        "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
       );`
    );
    await db.run(
      `
      CREATE TABLE IF NOT EXISTS invoice_bank_snapshots (
        "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
        "parentInvoiceId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "bankName" TEXT NOT NULL,
        "accountNumber" TEXT NOT NULL,
        "swiftCode" TEXT,
        "address" TEXT,
        "branchCode" TEXT,
        "type" TEXT,
        "routingNumber" TEXT,
        "upiCode" TEXT,
        "qrCode" ${getColumnType('BLOB', db.type)},
        "qrCodeFileSize" INTEGER,
        "qrCodeFileType" TEXT,
        "qrCodeFileName" TEXT,
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
        FOREIGN KEY("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
      );
      `
    );

    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_bank_snapshots_parentInvoiceId ON invoice_bank_snapshots("parentInvoiceId")`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS idx_banks_bankname_accountnumber ON banks("bankName", "accountNumber");`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_banks_active ON banks("isArchived")`);

    if (db.type === DatabaseType.sqlite) {
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
          FOREIGN KEY("styleProfilesId") REFERENCES style_profiles("id"),
          FOREIGN KEY("businessId") REFERENCES businesses("id"),
          FOREIGN KEY("clientId") REFERENCES clients("id"),
          FOREIGN KEY("currencyId") REFERENCES currencies("id"),
          FOREIGN KEY("convertedFromQuotationId") REFERENCES invoices("id"),
          FOREIGN KEY ("bankId") REFERENCES banks("id"),
          UNIQUE("businessId","invoiceFullNumber"),
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
          "styleProfilesId"
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
          i."styleProfilesId"
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
    }
    if (db.type === DatabaseType.postgre) {
      await db.run(`
        ALTER TABLE invoices
        ADD COLUMN "bankId" INTEGER;
      `);
      await db.run(`
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_bankId_fkey
        FOREIGN KEY ("bankId") REFERENCES banks("id");
      `);
      await db.run(`
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_styleProfilesId_fkey
        FOREIGN KEY ("styleProfilesId") REFERENCES style_profiles("id");
      `);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_styleProfilesId ON invoices("styleProfilesId")`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_bankId ON invoices("bankId")`);
    }

    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_active ON invoices("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_style_profiles_active ON style_profiles("isArchived")`);

    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
