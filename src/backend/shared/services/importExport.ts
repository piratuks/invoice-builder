import { DatabaseType } from '../enums/databaseType';
import type { Bank } from '../types/bank';
import type { Business } from '../types/business';
import type { Category } from '../types/category';
import type { Client } from '../types/client';
import type { Currency } from '../types/currency';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { DbValue } from '../types/dbValue';
import type {
  Invoice,
  InvoiceAttachment,
  InvoiceBankSnapshots,
  InvoiceBusinessSnapshots,
  InvoiceClientSnapshots,
  InvoiceCurrencySnapshots,
  InvoiceCustomization,
  InvoiceItem,
  InvoiceItemSnapshots,
  InvoiceLayoutSnapshots,
  InvoicePayment,
  InvoiceStyleProfileSnapshots
} from '../types/invoice';
import type { Item } from '../types/item';
import type { Layout } from '../types/layouts';
import type { StyleProfile } from '../types/styleProfiles';
import type { Unit } from '../types/unit';
import {
  decodeBank,
  decodeInvoiceAttachment,
  decodeInvoiceBankSnapshotImport,
  decodeInvoiceBusinessSnapshotImport,
  decodeInvoiceCustomizationImport,
  decodeInvoiceImport,
  decodeLogo,
  decodePreset,
  decodeStyleProfile,
  encodeBank,
  encodeInvoiceAttachment,
  encodeInvoiceBankSnapshotExport,
  encodeInvoiceBusinessSnapshotExport,
  encodeInvoiceCustomizationExport,
  encodeInvoiceExport,
  encodeLogo,
  encodePreset,
  encodeStyleProfile
} from '../utils/dataUrlFunctions';
import { convertBooleanFieldsToInt, toDbValue } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const exportAllData = async (db: DatabaseAdapter) => {
  try {
    const presets = await db.all<Bank>('SELECT * FROM presets');
    const invoiceSequences = await db.all<Bank>('SELECT * FROM invoice_sequences');
    const banks = await db.all<Bank>('SELECT * FROM banks');
    const layouts = await db.all<Layout>('SELECT * FROM layouts');
    const styleProfiles = await db.all<StyleProfile>('SELECT * FROM style_profiles');
    const settingsRow = await db.get('SELECT * FROM settings LIMIT 1');
    const businesses = await db.all<Business>('SELECT * FROM businesses');
    const clients = await db.all<Client>('SELECT * FROM clients');
    const items = await db.all<Item>('SELECT * FROM items');
    const units = await db.all<Unit>('SELECT * FROM units');
    const categories = await db.all<Category>('SELECT * FROM categories');
    const currencies = await db.all<Currency>('SELECT * FROM currencies');
    const invoices = await db.all<Invoice>('SELECT * FROM invoices');
    const invoiceLayoutSnapshots = await db.all<InvoiceLayoutSnapshots>('SELECT * FROM invoice_layout_snapshots');
    const invoiceBankSnapshots = await db.all<InvoiceBankSnapshots>('SELECT * FROM invoice_bank_snapshots');
    const invoiceBusinessSnapshots = await db.all<InvoiceBusinessSnapshots>('SELECT * FROM invoice_business_snapshots');
    const invoiceClientSnapshots = await db.all<InvoiceClientSnapshots>('SELECT * FROM invoice_client_snapshots');
    const invoiceCurrencySnapshots = await db.all<InvoiceCurrencySnapshots>('SELECT * FROM invoice_currency_snapshots');
    const invoiceStyleProfileSnapshots = await db.all<InvoiceStyleProfileSnapshots>(
      'SELECT * FROM invoice_style_profile_snapshots'
    );
    const invoiceItemSnapshots = await db.all<InvoiceItemSnapshots>('SELECT * FROM invoice_item_snapshots');
    const invoiceCustomizations = await db.all<InvoiceCustomization>('SELECT * FROM invoice_customizations');
    const invoiceItems = await db.all<InvoiceItem>('SELECT * FROM invoice_items');
    const invoicePayments = await db.all<InvoicePayment>('SELECT * FROM invoice_payments');
    const attachments = await db.all<InvoiceAttachment>('SELECT * FROM attachments');

    const presetsModified = presets.map(item => encodePreset(item, true));
    const attachmentsModified = attachments.map(encodeInvoiceAttachment);
    const businessesModified = businesses.map(encodeLogo);
    const styleProfilesModified = styleProfiles.map(encodeStyleProfile);
    const banksModified = banks.map(encodeBank);
    const invoicesModified = invoices.map(encodeInvoiceExport);
    const invoiceBankSnapshotsModified = invoiceBankSnapshots.map(encodeInvoiceBankSnapshotExport);
    const invoiceBusinessSnapshotsModified = invoiceBusinessSnapshots.map(encodeInvoiceBusinessSnapshotExport);
    const invoiceCustomizationsModified = invoiceCustomizations.map(encodeInvoiceCustomizationExport);

    const payload = {
      presets: presetsModified,
      settings: settingsRow ?? null,
      businesses: businessesModified,
      clients,
      invoiceSequences,
      items,
      units,
      categories,
      currencies,
      layouts,
      invoices: invoicesModified,
      invoiceBankSnapshots: invoiceBankSnapshotsModified,
      invoiceBusinessSnapshots: invoiceBusinessSnapshotsModified,
      invoiceCustomizations: invoiceCustomizationsModified,
      invoiceClientSnapshots,
      invoiceCurrencySnapshots,
      invoiceStyleProfileSnapshots,
      invoiceLayoutSnapshots,
      styleProfiles: styleProfilesModified,
      banks: banksModified,
      invoiceItems,
      invoiceItemSnapshots,
      invoicePayments,
      attachments: attachmentsModified
    };

    return { success: true, data: payload };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const importAllData = async (db: DatabaseAdapter, parsed: Record<string, unknown>) => {
  const runInTransaction = async (fn: () => Promise<void>) => {
    try {
      if (db.type === DatabaseType.sqlite) {
        await db.run('PRAGMA foreign_keys = OFF;');
      }
      await db.run('BEGIN');
      await fn();
      await db.run('COMMIT');
    } catch (err) {
      try {
        await db.run('ROLLBACK');
      } catch {
        throw new Error(`error.rollbackFailed`);
      }
      throw err;
    } finally {
      if (db.type === DatabaseType.sqlite) {
        await db.run('PRAGMA foreign_keys = ON;');
      }
    }
  };

  const insertRows = async <T extends Record<string, unknown>>(table: string, rows: T[]) => {
    for (let row of rows) {
      row = convertBooleanFieldsToInt(row);

      const keys = Object.keys(row).filter(k => k !== 'invoiceFullNumber');
      if (!keys.length) continue;
      const cols = keys.map(k => `"${k}"`).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const params = keys.map(k => toDbValue(row[k]));
      if (db.type === DatabaseType.postgre) {
        await db.run(
          `INSERT INTO ${table} (${cols}) 
          OVERRIDING SYSTEM VALUE
          VALUES (${placeholders})`,
          params
        );
      } else {
        await db.run(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, params);
      }
    }
  };

  const updateSettings = async (settings: Record<string, unknown>) => {
    settings = convertBooleanFieldsToInt(settings);

    const fields: string[] = [];
    const params: DbValue[] = [];

    Object.entries(settings).forEach(([k, v]) => {
      if (k === 'id') return;
      fields.push(`"${k}" = ?`);
      params.push(toDbValue(v));
    });

    if (fields.length) {
      await db.run(`UPDATE settings SET ${fields.join(', ')} WHERE "id" = (SELECT "id" FROM settings LIMIT 1)`, params);
    }
  };

  try {
    if (!parsed || typeof parsed !== 'object') return { success: false, key: 'invalidFile' };

    await runInTransaction(async () => {
      const deleteOrder = [
        'presets',
        'invoice_sequences',
        'invoice_style_profile_snapshots',
        'invoice_customizations',
        'invoice_currency_snapshots',
        'invoice_client_snapshots',
        'invoice_bank_snapshots',
        'invoice_business_snapshots',
        'invoice_item_snapshots',
        'invoice_items',
        'invoice_layout_snapshots',
        'attachments',
        'invoices',
        'items',
        'businesses',
        'clients',
        'units',
        'categories',
        'currencies',
        'style_profiles',
        'layouts',
        'banks'
      ];

      for (const table of deleteOrder) {
        await db.run(`DELETE FROM ${table}`);
      }

      const tableDataMap: Record<string, string> = {
        currencies: 'currencies',
        units: 'units',
        categories: 'categories',
        businesses: 'businesses',
        layouts: 'layouts',
        style_profiles: 'styleProfiles',
        banks: 'banks',
        clients: 'clients',
        items: 'items',
        invoices: 'invoices',
        invoice_sequences: 'invoiceSequences',
        invoice_style_profile_snapshots: 'invoiceStyleProfileSnapshots',
        invoice_business_snapshots: 'invoiceBusinessSnapshots',
        invoice_bank_snapshots: 'invoiceBankSnapshots',
        invoice_customizations: 'invoiceCustomizations',
        invoice_client_snapshots: 'invoiceClientSnapshots',
        invoice_currency_snapshots: 'invoiceCurrencySnapshots',
        invoice_items: 'invoiceItems',
        invoice_item_snapshots: 'invoiceItemSnapshots',
        invoice_layout_snapshots: 'invoiceLayoutSnapshots',
        invoice_payments: 'invoicePayments',
        attachments: 'attachments',
        presets: 'presets'
      };

      const parsedMut = { ...parsed };

      if (Array.isArray(parsedMut.attachments)) {
        parsedMut.attachments = parsedMut.attachments.map(decodeInvoiceAttachment);
      }
      if (Array.isArray(parsedMut.styleProfiles)) {
        parsedMut.styleProfiles = parsedMut.styleProfiles.map(decodeStyleProfile);
      }
      if (Array.isArray(parsedMut.banks)) {
        parsedMut.banks = parsedMut.banks.map(decodeBank);
      }
      if (Array.isArray(parsedMut.businesses)) {
        parsedMut.businesses = parsedMut.businesses.map(decodeLogo);
      }
      if (Array.isArray(parsedMut.invoices)) {
        parsedMut.invoices = parsedMut.invoices.map(decodeInvoiceImport);
      }
      if (Array.isArray(parsedMut.invoiceBusinessSnapshots)) {
        parsedMut.invoiceBusinessSnapshots = parsedMut.invoiceBusinessSnapshots.map(
          decodeInvoiceBusinessSnapshotImport
        );
      }
      if (Array.isArray(parsedMut.invoiceBankSnapshots)) {
        parsedMut.invoiceBankSnapshots = parsedMut.invoiceBankSnapshots.map(decodeInvoiceBankSnapshotImport);
      }
      if (Array.isArray(parsedMut.invoiceCustomizations)) {
        parsedMut.invoiceCustomizations = parsedMut.invoiceCustomizations.map(decodeInvoiceCustomizationImport);
      }
      if (Array.isArray(parsedMut.presets)) {
        parsedMut.presets = parsedMut.presets.map(item => decodePreset(item, true));
      }

      for (const [table, key] of Object.entries(tableDataMap)) {
        await insertRows(table, ((parsedMut as Record<string, unknown>)[key] as Record<string, unknown>[]) ?? []);
        if (db.type === DatabaseType.postgre) {
          await db.run(`
            SELECT setval(
              pg_get_serial_sequence('${table}', 'id'),
              (SELECT MAX(id) FROM ${table})
            );`);
        }
      }

      if (parsedMut.settings && typeof parsedMut.settings === 'object') {
        await updateSettings(parsedMut.settings as Record<string, unknown>);
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
