import sqlite3 from 'sqlite3';
import { createSqliteAdapter } from '../../db/client';
import { initSchema } from '../../db/setup';
import type { DatabaseAdapter } from '../../types/DatabaseAdapter';
import { getTableColumns, isTableExists } from '../../utils/dbHelper';
import { up as quantityToText } from '../20260105-01-invoice_items-quantity-to-text';
import { up as prefixSuffixLanguage } from '../20260108-02-invoices-prefix-suffix-language';
import { up as ghostDataCleanup } from '../20260108-03-invoices-ghost-data-cleanup';
import { up as invoicesSignature } from '../20260122-04-invoices-signature';
import { up as styleProfiles } from '../20260129-05-style_profiles';
import { up as styleProfileColumnRenames } from '../20260202-06-style_profile-column-renames';
import { up as snapshotTables } from '../20260202-07-snapshot-tables';
import { up as customizeItemsTable } from '../20260203-08-customize-items-table';
import { up as invoiceItemSnapshotsFixName } from '../20260205-09-invoice_item_snapshots_fix-name';
import { up as convertingAmountFields } from '../20260206-10-converting-amount-fields';
import { up as customFieldsOrder } from '../20260209-11-custom-fields-order';
import { up as banksTable } from '../20260209-12-banks-table';
import { up as vatCodeFields } from '../20260212-13-vat-code-fields';
import { up as invoiceSequences } from '../20260218-14-invoice_sequences';
import { up as customizeFont } from '../20260218-15-customize-font';
import { up as customLabels } from '../20260218-16-custom-labels';
import { up as banksFields } from '../20260220-17-banks-fields';
import { up as templates } from '../20260220-18-templates';
import { up as styleProfileDefaultFont } from '../20260228-19-style_profile-default-font';
import { up as peppolFields } from '../20260228-20-peppol-fields';
import { up as xrechnungFields } from '../20260304-21-xrechnung-fields';
import { up as paidAtClosedAt } from '../20260612-21-paidAt-closedAt';
import { up as invoiceUnique22 } from '../20260810-22-invoice-unique';
import { up as invoiceSurcharge } from '../20260826-23-invoice-surcharge';
import { up as invoiceUnique24 } from '../20260826-24-invoice-unique';
import { up as invoiceSequence25 } from '../20260826-25-invoice-sequence';
import { up as settingsReceipt } from '../20260831-26-settings-receipt';
import { up as invoiceLayouts } from '../20260902-27-invoice_layouts';
import { up as layoutSchemaSeeds } from '../20260902-28-layout-schema-seeds';
import { up as styleProfilesLayoutId } from '../20260903-29-style-profiles-layout-id';
import { up as layoutSchemaRepair } from '../20260915-30-layout-schema-repair';

describe('all migrations applied sequentially against a fresh schema', () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = createSqliteAdapter(new sqlite3.Database(':memory:'));
    await initSchema(db);
  });

  it('runs every migration in chronological order without throwing and evolves the schema as expected', async () => {
    await quantityToText(db);
    await prefixSuffixLanguage(db);
    await ghostDataCleanup(db);
    await invoicesSignature(db);
    await styleProfiles(db);
    await styleProfileColumnRenames(db);
    await snapshotTables(db);
    await customizeItemsTable(db);
    await invoiceItemSnapshotsFixName(db);
    await convertingAmountFields(db);
    await customFieldsOrder(db);
    await banksTable(db);
    await vatCodeFields(db);
    await invoiceSequences(db);
    await customizeFont(db);
    await customLabels(db);
    await banksFields(db);
    await templates(db);
    await styleProfileDefaultFont(db);
    await peppolFields(db);
    await xrechnungFields(db);
    await paidAtClosedAt(db);
    await invoiceUnique22(db);
    await invoiceSurcharge(db);
    await invoiceUnique24(db);
    await invoiceSequence25(db);
    await settingsReceipt(db);
    await invoiceLayouts(db);
    await layoutSchemaSeeds(db);
    await styleProfilesLayoutId(db);
    await layoutSchemaRepair(db);

    const invoiceCols = (await getTableColumns(db, 'invoices')).map(c => c.name);
    expect(invoiceCols).toEqual(
      expect.arrayContaining([
        'invoicePrefix',
        'invoiceSuffix',
        'signatureData',
        'discountAmountCents',
        'bankId',
        'surchargeName',
        'surchargeAmountCents',
        'paidAt',
        'closedAt',
        'styleProfilesId'
      ])
    );

    const settingsCols = (await getTableColumns(db, 'settings')).map(c => c.name);
    expect(settingsCols).toEqual(
      expect.arrayContaining(['styleProfilesON', 'presetsON', 'ublON', 'xrechnungON', 'receiptPrintingOn'])
    );

    const styleProfileCols = (await getTableColumns(db, 'style_profiles')).map(c => c.name);
    expect(styleProfileCols).toEqual(
      expect.arrayContaining([
        'fontSize',
        'showQuantity',
        'showUnit',
        'showRowNo',
        'fieldSortOrders',
        'fontFamily',
        'pdfTexts',
        'layoutId'
      ])
    );
    expect(styleProfileCols).not.toContain('layout');

    const clientCols = (await getTableColumns(db, 'clients')).map(c => c.name);
    expect(clientCols).toEqual(expect.arrayContaining(['vatCode', 'peppolEndpointId', 'countryCode']));

    const businessCols = (await getTableColumns(db, 'businesses')).map(c => c.name);
    expect(businessCols).toEqual(expect.arrayContaining(['vatCode', 'code', 'peppolEndpointId']));

    const banksCols = (await getTableColumns(db, 'banks')).map(c => c.name);
    expect(banksCols).toEqual(expect.arrayContaining(['accountHolder', 'sortOrder']));

    expect(await isTableExists(db, 'banks')).toBe(true);
    expect(await isTableExists(db, 'presets')).toBe(true);
    expect(await isTableExists(db, 'invoice_sequences')).toBe(true);
    expect(await isTableExists(db, 'invoice_business_snapshots')).toBe(true);
    expect(await isTableExists(db, 'invoice_item_snapshots')).toBe(true);
    expect(await isTableExists(db, 'layouts')).toBe(true);

    const sequenceCols = (await getTableColumns(db, 'invoice_sequences')).map(c => c.name);
    expect(sequenceCols).toContain('invoiceType');

    const layouts = await db.all<{ id: number }>('SELECT "id" FROM layouts');
    expect(layouts.length).toBeGreaterThan(0);
  });

  it('is idempotent when the migrations are re-applied on an already-migrated schema', async () => {
    await quantityToText(db);
    await prefixSuffixLanguage(db);
    await ghostDataCleanup(db);
    await invoicesSignature(db);
    await styleProfiles(db);
    await styleProfileColumnRenames(db);
    await snapshotTables(db);
    await customizeItemsTable(db);
    await invoiceItemSnapshotsFixName(db);
    await convertingAmountFields(db);
    await customFieldsOrder(db);
    await banksTable(db);
    await vatCodeFields(db);
    await invoiceSequences(db);
    await customizeFont(db);
    await customLabels(db);
    await banksFields(db);
    await templates(db);
    await styleProfileDefaultFont(db);
    await peppolFields(db);
    await xrechnungFields(db);
    await paidAtClosedAt(db);
    await invoiceUnique22(db);
    await invoiceSurcharge(db);
    await invoiceUnique24(db);
    await invoiceSequence25(db);
    await settingsReceipt(db);
    await invoiceLayouts(db);
    await layoutSchemaSeeds(db);
    await styleProfilesLayoutId(db);
    await layoutSchemaRepair(db);

    // re-applying every migration a second time should hit each early-return guard without error
    await expect(quantityToText(db)).resolves.not.toThrow();
    await expect(prefixSuffixLanguage(db)).resolves.not.toThrow();
    await expect(invoicesSignature(db)).resolves.not.toThrow();
    await expect(styleProfiles(db)).resolves.not.toThrow();
    await expect(styleProfileColumnRenames(db)).resolves.not.toThrow();
    await expect(snapshotTables(db)).resolves.not.toThrow();
    await expect(customizeItemsTable(db)).resolves.not.toThrow();
    await expect(invoiceItemSnapshotsFixName(db)).resolves.not.toThrow();
    await expect(convertingAmountFields(db)).resolves.not.toThrow();
    await expect(customFieldsOrder(db)).resolves.not.toThrow();
    await expect(banksTable(db)).resolves.not.toThrow();
    await expect(vatCodeFields(db)).resolves.not.toThrow();
    await expect(invoiceSequences(db)).resolves.not.toThrow();
    await expect(customizeFont(db)).resolves.not.toThrow();
    await expect(customLabels(db)).resolves.not.toThrow();
    await expect(banksFields(db)).resolves.not.toThrow();
    await expect(templates(db)).resolves.not.toThrow();
    await expect(peppolFields(db)).resolves.not.toThrow();
    await expect(xrechnungFields(db)).resolves.not.toThrow();
    await expect(paidAtClosedAt(db)).resolves.not.toThrow();
    await expect(invoiceSurcharge(db)).resolves.not.toThrow();
    await expect(settingsReceipt(db)).resolves.not.toThrow();
    await expect(invoiceLayouts(db)).resolves.not.toThrow();
    await expect(layoutSchemaSeeds(db)).resolves.not.toThrow();
  });
});
