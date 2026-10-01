import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import sqlite3 from 'sqlite3';
import type { PostgresConfig } from '@invoice-builder/contracts';
import { DatabaseType } from '@invoice-builder/contracts';

import type { DatabaseAdapter } from '../types/DatabaseAdapter';

import { getColumnType, getDefaultValue, insertOrIgnore } from '../utils/dbHelper';
import { createPostgresAdapter, createSqliteAdapter } from './client';
import { seedDefaultLayouts } from './layoutDefaults';

const sanitizeDatabaseName = (database: string): string => {
  if (typeof database !== 'string' || database.trim().length === 0) {
    throw new Error('error.invalidDBName');
  }
  const trimmed = database.trim();
  const maxLength = 63;
  if (trimmed.length > maxLength) {
    throw new Error('error.databaseNameTooLong');
  }
  if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
    throw new Error('error.databaseNameInvalid');
  }
  return trimmed;
};

export const testPostgresConnection = async (data?: PostgresConfig): Promise<void> => {
  if (!data) throw new Error('error.connectionFailed');

  const { host, port, user, password, ssl } = data;

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
  } catch {
    throw new Error('error.connectionFailed');
  } finally {
    await client.end().catch(() => {});
  }
};

export const openPostgreSql = async (data: PostgresConfig): Promise<{ db: DatabaseAdapter }> => {
  const { host, port, user, password, database, ssl } = data;
  const safeDatabase = sanitizeDatabaseName(database);

  const authPart = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user);
  const sslPart = ssl ? '?sslmode=require' : '';
  const connectionString = `postgresql://${authPart}@${host}:${port}/${safeDatabase}${sslPart}`;

  try {
    const tempClient = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres',
      ssl
    });
    await tempClient.connect();
    const res = await tempClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [safeDatabase]);
    if (res.rowCount === 0) {
      await tempClient.query(`CREATE DATABASE "${safeDatabase}"`);
    }
    await tempClient.end();
  } catch {
    throw new Error('error.databaseCreationFailed');
  }

  const adapter = await createPostgresAdapter(connectionString);

  return { db: adapter };
};

export const openSqlLite = async (data: {
  fullPath?: string;
  createIfMissing: boolean;
}): Promise<{ db: DatabaseAdapter }> => {
  const { fullPath, createIfMissing } = data;

  if (!fullPath) throw new Error('error.databasePathInvalid');

  const folder = path.dirname(fullPath);
  fs.mkdirSync(folder, { recursive: true });

  if (createIfMissing) {
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      } else {
        throw new Error(String(err));
      }
    }
  } else {
    if (!fs.existsSync(fullPath)) {
      throw new Error('error.databaseFileNotExist');
    }
  }

  const db = await new Promise<sqlite3.Database>((resolve, reject) => {
    const database = new sqlite3.Database(fullPath, err => {
      if (err) {
        reject(new Error(`error.failedToOpenDB`));
        return;
      }
      console.log('Database opened successfully.');
      resolve(database);
    });
  });
  const adapter = createSqliteAdapter(db);
  await adapter.run('PRAGMA foreign_keys = ON;');

  return { db: adapter };
};

export const initSchema = async (db: DatabaseAdapter): Promise<void> => {
  try {
    if (db.type === DatabaseType.sqlite) {
      await db.run('PRAGMA foreign_keys = ON;');
    }
    await db.run('BEGIN');
    await db.run(
      `CREATE TABLE IF NOT EXISTS migrations (
      "name" TEXT PRIMARY KEY,
      "appliedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS settings (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "language" TEXT NOT NULL DEFAULT 'en',
      "amountFormat" TEXT NOT NULL DEFAULT 'en-US',
      "dateFormat" TEXT NOT NULL DEFAULT 'MM/dd/yyyy',
      "isDarkMode" INTEGER NOT NULL DEFAULT 1 CHECK ("isDarkMode" IN (0,1)),
      "invoicePrefix" TEXT,
      "invoiceSuffix" TEXT,
      "shouldIncludeYear" INTEGER NOT NULL DEFAULT 1 CHECK ("shouldIncludeYear" IN (0,1)),
      "shouldIncludeMonth" INTEGER NOT NULL DEFAULT 1 CHECK ("shouldIncludeMonth" IN (0,1)),
      "shouldIncludeBusinessName" INTEGER NOT NULL DEFAULT 1 CHECK ("shouldIncludeBusinessName" IN (0,1)),
      "quotesON" INTEGER NOT NULL DEFAULT 1 CHECK ("quotesON" IN (0,1)),
      "reportsON" INTEGER NOT NULL DEFAULT 1 CHECK ("reportsON" IN (0,1)),
      "styleProfilesON" INTEGER NOT NULL DEFAULT 1 CHECK ("styleProfilesON" IN (0,1)),
      "presetsON" INTEGER NOT NULL DEFAULT 1 CHECK ("presetsON" IN (0,1)),
      "ublON" INTEGER NOT NULL DEFAULT 1 CHECK ("ublON" IN (0,1)),
      "xrechnungON" INTEGER NOT NULL DEFAULT 1 CHECK ("xrechnungON" IN (0,1)),
      "receiptPrintingOn" INTEGER NOT NULL DEFAULT 1 CHECK ("receiptPrintingOn" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    )`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS businesses (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "name" TEXT NOT NULL,
      "shortName" TEXT NOT NULL CHECK (length("shortName") <= 2),
      "address" TEXT,
      "role" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "website" TEXT,
      "additional" TEXT,
      "paymentInformation" TEXT,
      "logo" ${getColumnType('BLOB', db.type)},
      "fileSize" INTEGER,
      "fileType" TEXT,
      "fileName" TEXT,
      "vatCode" TEXT,
      "code" TEXT,
      "peppolEndpointId" TEXT,
      "countryCode" TEXT,
      "peppolEndpointSchemeId" TEXT,
      "description" TEXT,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS clients (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "name" TEXT NOT NULL,
      "shortName" TEXT NOT NULL CHECK (length("shortName") <= 2),
      "address" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "code" TEXT,
      "additional" TEXT,
      "vatCode" TEXT,
      "peppolEndpointId" TEXT,
      "countryCode" TEXT,
      "peppolEndpointSchemeId" TEXT,
      "buyerReference" TEXT,
      "description" TEXT,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS units (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "name" TEXT NOT NULL UNIQUE,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS categories (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "name" TEXT NOT NULL UNIQUE,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS currencies (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "code" TEXT NOT NULL UNIQUE,
      "symbol" TEXT NOT NULL,
      "text" TEXT NOT NULL,
      "format" TEXT NOT NULL,
      "subunit" INTEGER NOT NULL DEFAULT 100,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS items (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "name" TEXT NOT NULL,
      "amount" TEXT NOT NULL DEFAULT '0',
      "unitId" INTEGER,
      "categoryId" INTEGER,
      "description" TEXT,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("unitId") REFERENCES units("id"),
      FOREIGN KEY ("categoryId") REFERENCES categories("id")
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS layouts (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "schema" TEXT NOT NULL,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS idx_layouts_id ON layouts("id")`);
    await db.run(
      `CREATE TABLE IF NOT EXISTS style_profiles (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "name" TEXT NOT NULL UNIQUE,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "color" TEXT,
      "logoSize" TEXT,
      "fontSize" TEXT,
      "fontFamily" TEXT,
      "pdfTexts" TEXT,
      "layoutId" INTEGER REFERENCES layouts("id"),
      "tableHeaderStyle" TEXT,
      "tableRowStyle" TEXT,
      "pageFormat" TEXT,
      "labelUpperCase" INTEGER NOT NULL DEFAULT 0 CHECK ("labelUpperCase" IN (0,1)),
      "showQuantity" INTEGER NOT NULL DEFAULT 1 CHECK ("showQuantity" IN (0,1)),
      "showUnit" INTEGER NOT NULL DEFAULT 1 CHECK ("showUnit" IN (0,1)),
      "showRowNo" INTEGER NOT NULL DEFAULT 1 CHECK ("showRowNo" IN (0,1)),
      "fieldSortOrders" TEXT NOT NULL DEFAULT '{"no":0,"item":1,"unit":2,"quantity":3,"unitCost":4,"total":5}',
      "watermarkFileName" TEXT,
      "watermarkFileType" TEXT,
      "watermarkFileSize" INTEGER,
      "watermarkFileData" ${getColumnType('BLOB', db.type)},
      "paidWatermarkFileName" TEXT,
      "paidWatermarkFileType" TEXT,
      "paidWatermarkFileSize" INTEGER,
      "paidWatermarkFileData" ${getColumnType('BLOB', db.type)},
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS idx_style_profiles_id ON style_profiles("id")`);
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
      "accountHolder" TEXT,
      "sortOrder" TEXT,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)}
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS presets (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "name" TEXT NOT NULL UNIQUE,
      "businessId" INTEGER,
      "clientId" INTEGER,
      "currencyId" INTEGER,
      "bankId" INTEGER,
      "customerNotes" TEXT,
      "thanksNotes" TEXT,
      "termsConditionNotes" TEXT,
      "language" TEXT,
      "signatureData" ${getColumnType('BLOB', db.type)},
      "signatureName" TEXT,
      "signatureType" TEXT,
      "signatureSize" INTEGER,
      "styleProfilesId" INTEGER,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("styleProfilesId") REFERENCES style_profiles("id") ON DELETE CASCADE,
      FOREIGN KEY ("businessId") REFERENCES businesses("id") ON DELETE CASCADE,
      FOREIGN KEY ("clientId") REFERENCES clients("id") ON DELETE CASCADE,
      FOREIGN KEY ("currencyId") REFERENCES currencies("id") ON DELETE CASCADE,
      FOREIGN KEY ("bankId") REFERENCES banks("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoices (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "invoiceType" TEXT NOT NULL CHECK("invoiceType" IN ('quotation','invoice')),
      "convertedFromQuotationId" INTEGER NULL,
      "businessId" INTEGER NOT NULL,
      "clientId" INTEGER NOT NULL,
      "currencyId" INTEGER NOT NULL,
      "bankId" INTEGER,
      "layoutId" INTEGER REFERENCES layouts("id"),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "issuedAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
      "dueDate" ${getColumnType('DATETIME', db.type)},
      "paidAt" ${getColumnType('DATETIME', db.type)},
      "closedAt" ${getColumnType('DATETIME', db.type)},
      "invoiceNumber" TEXT NOT NULL,
      "isArchived" INTEGER NOT NULL DEFAULT 0 CHECK ("isArchived" IN (0,1)),
      "status" TEXT NOT NULL DEFAULT 'unpaid' CHECK ("status" IN ('unpaid','open','closed','partially','paid')),
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
      "signatureData" ${getColumnType('BLOB', db.type)},
      "signatureName" TEXT,
      "signatureType" TEXT,
      "signatureSize" INTEGER,
      "styleProfilesId" INTEGER,
      "invoiceFullNumber" TEXT GENERATED ALWAYS AS (
        COALESCE("invoicePrefix", '') || "invoiceNumber" || COALESCE("invoiceSuffix", '')
      ) STORED,
      "language" TEXT NOT NULL DEFAULT 'en',
      FOREIGN KEY ("businessId") REFERENCES businesses(id),
      FOREIGN KEY ("clientId") REFERENCES clients(id),
      FOREIGN KEY ("currencyId") REFERENCES currencies(id),
      FOREIGN KEY ("convertedFromQuotationId") REFERENCES invoices(id),
      FOREIGN KEY ("styleProfilesId") REFERENCES style_profiles("id"),
      FOREIGN KEY ("bankId") REFERENCES banks("id"),
      UNIQUE ("businessId", "invoiceFullNumber", "clientId", "invoiceType"),
      CHECK (
        ("discountType" = 'fixed' AND CAST("discountAmountCents" AS NUMERIC) >= 0 AND "discountPercent" = 0) OR
        ("discountType" = 'percentage' AND "discountPercent" <= 100 AND "discountPercent" >= 0 AND CAST("discountAmountCents" AS NUMERIC) = 0) OR
        ("discountType" IS NULL AND CAST("discountAmountCents" AS NUMERIC) = 0 AND "discountPercent" = 0)
      ),
      CHECK ("dueDate" IS NULL OR "dueDate" >= "issuedAt"),
      CHECK ("convertedFromQuotationId" IS NULL OR "convertedFromQuotationId" != "id")
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_layout_snapshots (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,
      "layoutSchema" TEXT NOT NULL,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      UNIQUE ("parentInvoiceId"),
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_layout_snapshots_parentInvoiceId ON invoice_layout_snapshots("parentInvoiceId")`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_bank_snapshots (
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
      "accountHolder" TEXT,
      "sortOrder" TEXT,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_sequences (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "businessId" INTEGER NOT NULL,
      "clientId" INTEGER NOT NULL,
      "nextSequence" BIGINT NOT NULL,
      "invoiceType" TEXT NOT NULL DEFAULT 'invoice' CHECK ("invoiceType" IN ('quotation','invoice')),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      UNIQUE ("businessId", "clientId", "invoiceType")
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS workspaces (
      "workspaceId" TEXT PRIMARY KEY,
      "databaseKey" TEXT,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS sessions (
      "token" TEXT PRIMARY KEY,
      "workspaceId" TEXT NOT NULL,
      "databaseKey" TEXT,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
      "expiresAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
      FOREIGN KEY ("workspaceId") REFERENCES workspaces("workspaceId")
    );`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_workspaceId ON sessions("workspaceId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions("expiresAt")`);
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_items (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,    
      "itemId" INTEGER NOT NULL,
      "customField" TEXT,
      "quantity" TEXT NOT NULL DEFAULT '0',
      "taxRate" REAL NOT NULL DEFAULT 0,
      "taxType" TEXT CHECK("taxType" IN ('exclusive','inclusive') OR "taxType" IS NULL),
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE,
      FOREIGN KEY ("itemId") REFERENCES items("id")
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_business_snapshots (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,
      "businessName" TEXT NOT NULL,
      "businessShortName" TEXT NOT NULL CHECK (length("businessShortName") <= 2),
      "businessAddress" TEXT,
      "businessRole" TEXT,
      "businessEmail" TEXT,
      "businessPhone" TEXT,
      "businessAdditional" TEXT,
      "businessPaymentInformation" TEXT,
      "businessLogo" ${getColumnType('BLOB', db.type)},
      "businessFileSize" INTEGER,
      "businessFileType" TEXT,
      "businessFileName" TEXT,
      "businessVatCode" TEXT,
      "businessCode" TEXT,
      "businessPeppolEndpointId" TEXT,
      "businessCountryCode" TEXT,
      "businessPeppolEndpointSchemeId" TEXT,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_client_snapshots (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,
      "clientName" TEXT NOT NULL,
      "clientAddress" TEXT,
      "clientEmail" TEXT,
      "clientPhone" TEXT,
      "clientCode" TEXT,
      "clientAdditional" TEXT,
      "clientVatCode" TEXT,
      "clientPeppolEndpointId" TEXT,
      "clientCountryCode" TEXT,
      "clientPeppolEndpointSchemeId" TEXT,
      "clientBuyerReference" TEXT,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_currency_snapshots (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,
      "currencyCode" TEXT NOT NULL,
      "currencySymbol" TEXT NOT NULL,
      "currencySubunit" INTEGER NOT NULL,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_customizations (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,
      "color" TEXT NOT NULL DEFAULT '#006400',
      "logoSize" TEXT NOT NULL DEFAULT 'medium',
      "fontSize" TEXT NOT NULL DEFAULT 'medium',
      "tableHeaderStyle" TEXT NOT NULL DEFAULT 'light',
      "tableRowStyle" TEXT NOT NULL DEFAULT 'classic',
      "pageFormat" TEXT NOT NULL DEFAULT 'A4',
      "labelUpperCase" INTEGER NOT NULL DEFAULT 0 CHECK ("labelUpperCase" IN (0,1)),
      "showQuantity" INTEGER NOT NULL DEFAULT 1 CHECK ("showQuantity" IN (0,1)),
      "showUnit" INTEGER NOT NULL DEFAULT 1 CHECK ("showUnit" IN (0,1)),
      "showRowNo" INTEGER NOT NULL DEFAULT 1 CHECK ("showRowNo" IN (0,1)),
      "fieldSortOrders" TEXT NOT NULL DEFAULT '{"no":0,"item":1,"unit":2,"quantity":3,"unitCost":4,"total":5}',
      "fontFamily" TEXT NOT NULL DEFAULT 'Roboto',
      "pdfTexts" TEXT,
      "watermarkFileName" TEXT,
      "watermarkFileType" TEXT,
      "watermarkFileSize" INTEGER,
      "watermarkFileData" ${getColumnType('BLOB', db.type)},
      "paidWatermarkFileName" TEXT,
      "paidWatermarkFileType" TEXT,
      "paidWatermarkFileSize" INTEGER,
      "paidWatermarkFileData" ${getColumnType('BLOB', db.type)},
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_style_profile_snapshots (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,
      "styleProfileName" TEXT NOT NULL,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_item_snapshots (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceItemId" INTEGER NOT NULL,
      "itemName" TEXT NOT NULL,
      "unitPriceCents" TEXT NOT NULL DEFAULT '0',
      "unitName" TEXT,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceItemId") REFERENCES invoice_items("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_business_snapshots_parentInvoiceId ON invoice_business_snapshots("parentInvoiceId")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_business_snapshots_businessName ON invoice_business_snapshots("businessName")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_business_snapshots_businessShortName ON invoice_business_snapshots("businessShortName")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_client_snapshots_parentInvoiceId ON invoice_client_snapshots("parentInvoiceId")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_client_snapshots_clientName ON invoice_client_snapshots("clientName")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_client_snapshots_clientCode ON invoice_client_snapshots("clientCode")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_currency_snapshots_parentInvoiceId ON invoice_currency_snapshots("parentInvoiceId")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_currency_snapshots_currencyCode ON invoice_currency_snapshots("currencyCode")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_customizations_parentInvoiceId ON invoice_customizations("parentInvoiceId")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_style_profile_snapshots_parentInvoiceId ON invoice_style_profile_snapshots("parentInvoiceId")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_item_snapshots_parentInvoiceItemId ON invoice_item_snapshots("parentInvoiceItemId")`
    );
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_item_snapshots_itemName ON invoice_item_snapshots("itemName")`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS invoice_payments (
      "id" ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,   
      "amountCents" TEXT NOT NULL,
      "paidAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "paymentMethod" TEXT NOT NULL,           
      "notes" TEXT,
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );
    await db.run(
      `CREATE TABLE IF NOT EXISTS attachments (
      id ${getColumnType('INTEGER PRIMARY KEY AUTOINCREMENT', db.type)},
      "parentInvoiceId" INTEGER NOT NULL,   
      "fileName" TEXT NOT NULL,
      "fileType" TEXT NOT NULL,            
      "fileSize" INTEGER NOT NULL,        
      "data" ${getColumnType('BLOB', db.type)} NOT NULL,                
      "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL DEFAULT ${getDefaultValue("(datetime('now'))", db.type)},
      FOREIGN KEY ("parentInvoiceId") REFERENCES invoices("id") ON DELETE CASCADE
    );`
    );

    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_items_invoiceId ON invoice_items("parentInvoiceId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoiceId ON invoice_payments("parentInvoiceId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_attachments_invoiceId ON attachments("parentInvoiceId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_clientId ON invoices("clientId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_businessId ON invoices("businessId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_business_client ON invoices("businessId", "clientId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices("invoiceType")`);
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoices_convertedFromQuotationId ON invoices("convertedFromQuotationId")`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_items_itemId ON invoice_items("itemId")`);
    await db.run(
      `CREATE INDEX IF NOT EXISTS idx_invoice_bank_snapshots_parentInvoiceId ON invoice_bank_snapshots("parentInvoiceId")`
    );
    await db.run(`CREATE INDEX IF NOT EXISTS idx_banks_bankname_accountnumber ON banks("bankName", "accountNumber")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_banks_active ON banks("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_bankId ON invoices("bankId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_layoutId ON invoices("layoutId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_active ON invoices("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_style_profiles_active ON style_profiles("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_items_unitId ON items("unitId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_items_categoryId ON items("categoryId")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_clients_active ON clients("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_items_active ON items("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_categories_active ON categories("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_units_active ON units("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies("isArchived")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_invoiceNumber ON invoices("invoiceNumber")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices("status")`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_issuedAt ON invoices("issuedAt")`);
    await db.run('COMMIT');
  } catch {
    try {
      await db.run('ROLLBACK');
    } catch {
      throw new Error(`error.rollbackFailed`);
    }
    throw new Error(`error.schemaInitFailed`);
  }
};

export const initInitialData = async (db: DatabaseAdapter): Promise<void> => {
  const row = await db.query('SELECT * FROM settings LIMIT 1');

  if (row && row.rows.length > 0) return;

  await db.run(insertOrIgnore('settings', [], [[]], db.type, 'id'));
  await db.run(
    insertOrIgnore(
      'currencies',
      ['code', 'symbol', 'text', 'format', 'subunit'],
      [
        ['USD', '$', 'United States Dollar', '{symbol}{amount}', '100'],
        ['EUR', '€', 'Euro', '{symbol}{amount}', '100'],
        ['SEK', 'kr', 'Swedish Krona', '{symbol} {amount}', '100'],
        ['GBP', '£', 'British Pound', '{symbol}{amount}', '100'],
        ['JPY', '¥', 'Japanese Yen', '{symbol}{amount}', '1'],
        ['AUD', 'A$', 'Australian Dollar', '{symbol}{amount}', '100'],
        ['CAD', 'CA$', 'Canadian Dollar', '{symbol}{amount}', '100'],
        ['CHF', 'CHF', 'Swiss Franc', '{symbol} {amount}', '100'],
        ['CNY', '¥', 'Chinese Yuan', '{symbol}{amount}', '100'],
        ['INR', '₹', 'Indian Rupee', '{symbol}{amount}', '100']
      ],
      db.type,
      'code'
    )
  );
  await db.run(
    insertOrIgnore(
      'units',
      ['name'],
      [
        ['pcs'],
        ['kgs'],
        ['gs'],
        ['lbs'],
        ['ozs'],
        ['ls'],
        ['mls'],
        ['ms'],
        ['cms'],
        ['fts'],
        ['hrs'],
        ['mins'],
        ['secs']
      ],
      db.type,
      'name'
    )
  );
  await db.run(insertOrIgnore('categories', ['name'], [['Goods'], ['Services']], db.type, 'name'));
  await seedDefaultLayouts(db);
};
