import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { mapDatabaseError } from '../utils/errorFunctions';

const legacySchema = (name: string) => JSON.stringify({ schemaVersion: 1, meta: { name } });

const layoutDescription = (name: string) =>
  name.startsWith('Legacy')
    ? 'Pre-created legacy layout preserved for existing documents that use business payment information. Do not use for new invoices or quotes.'
    : 'Pre-created layout using bank payment information for new invoices and quotes.';

const headerBlocks = (name: string) => {
  const title = { type: 'title' };
  const logo = { type: 'logo' };
  const business = { type: 'businessInfo' };
  const client = { type: 'clientInfo' };
  const meta = (options = {}) => ({ type: 'invoiceMeta', ...options });
  const legacyPayment = { type: 'paymentInfo', paymentSource: 'legacyBusiness', width: '60%' };
  const row = (children: object[], options = {}) => ({
    type: 'row',
    children,
    align: 'start',
    justify: 'between',
    ...options
  });

  switch (name) {
    case 'Modern':
      return [
        row([title, logo], { paddingBottom: 20 }),
        row([business, meta({ boxed: true, showInvoiceLabel: true })]),
        row([client], { paddingTop: 20 })
      ];
    case 'Compact':
      return [
        { type: 'column', children: [title], align: 'center', paddingBottom: 20 },
        row(
          [
            { type: 'column', children: [business], width: '40%' },
            { type: 'column', children: [client], width: '40%' },
            { type: 'column', children: [meta({ showInvoiceLabel: true })], width: '20%' }
          ],
          { gap: 10 }
        )
      ];
    case 'Legacy Classic':
      return [
        row([
          { type: 'column', width: '50%', children: [row([logo, business], { gap: 5 })] },
          { type: 'column', width: '50%', children: [meta({ showTitle: true })] }
        ]),
        row(
          [
            { type: 'column', width: '50%', children: [client] },
            { type: 'column', width: '50%', align: 'end', children: [legacyPayment] }
          ],
          { paddingTop: 20 }
        )
      ];
    case 'Legacy Modern':
      return [
        row([title, logo], { paddingBottom: 20 }),
        row([
          { type: 'column', width: '50%', children: [business] },
          { type: 'column', width: '50%', children: [meta({ showInvoiceLabel: true, boxed: true })] }
        ]),
        row(
          [
            { type: 'column', width: '50%', children: [client] },
            { type: 'column', width: '50%', align: 'end', children: [legacyPayment] }
          ],
          { paddingTop: 20 }
        )
      ];
    case 'Legacy Compact':
      return [
        { type: 'column', children: [title], align: 'center', paddingBottom: 20 },
        row(
          [
            { type: 'column', children: [business], width: '40%' },
            { type: 'column', children: [client], width: '40%' },
            { type: 'column', children: [meta({ showInvoiceLabel: true })], width: '20%' }
          ],
          { gap: 10 }
        )
      ];
    case 'Classic':
      return [
        row([
          { type: 'column', width: '50%', children: [row([logo, business], { gap: 5 })] },
          { type: 'column', width: '50%', children: [meta({ showTitle: true })] }
        ]),
        row([client], { paddingTop: 20 })
      ];
    default:
      return [row([row([logo, business]), meta({ showTitle: true })]), row([client], { paddingTop: 20 })];
  }
};

const declarativeSchema = (name: string, includePaymentInfo = false) => {
  const legacyCompactTotals = {
    type: 'totalsRow',
    visible: true,
    totalsBlocks: [
      { type: 'paymentInfo', paymentSource: 'legacyBusiness' },
      { type: 'spacer' },
      { type: 'financialTotals' }
    ]
  };
  const sections = [
    { type: 'watermark', visible: 'auto', watermarkOrder: 'paidFirst' },
    { type: 'header', visible: true, blocks: headerBlocks(name) },
    { type: 'itemsTable', visible: true, ...(name.startsWith('Legacy') ? { columnSizing: 'proportional' } : {}) },
    ...(name === 'Legacy Compact'
      ? [legacyCompactTotals]
      : [
          { type: 'financialTotals', visible: true },
          ...(includePaymentInfo ? [{ type: 'paymentInfo', visible: 'auto' }] : [])
        ]),
    { type: 'notes', visible: 'auto' },
    { type: 'signature', visible: 'auto' },
    { type: 'pageCounter', visible: true }
  ];

  return JSON.stringify({ schemaVersion: 1, meta: { name, description: layoutDescription(name) }, sections });
};

const seed = async (db: DatabaseAdapter, schema: string, isArchived: boolean, previousSchema?: string) => {
  if (previousSchema) {
    await db.run('UPDATE layouts SET "schema" = ?, "isArchived" = ? WHERE "schema" = ?', [
      schema,
      isArchived,
      previousSchema
    ]);
  }

  await db.run(
    'INSERT INTO layouts ("schema", "isArchived") SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM layouts WHERE "schema" = ?)',
    [schema, isArchived, schema]
  );

  await db.run('UPDATE layouts SET "isArchived" = ? WHERE "schema" = ?', [isArchived, schema]);
};

export const up = async (db: DatabaseAdapter) => {
  try {
    const currentClassicSchema = declarativeSchema('Classic');
    const classicSchema = declarativeSchema('Classic', true);
    const legacyClassicSchema = declarativeSchema('Legacy Classic', false);

    await seed(db, classicSchema, false, legacySchema('Classic'));
    await seed(db, classicSchema, false, currentClassicSchema);
    await seed(db, legacyClassicSchema, true, legacySchema('Legacy Classic'));

    const currentModernSchema = declarativeSchema('Modern');
    const modernSchema = declarativeSchema('Modern', true);
    const legacyModernSchema = declarativeSchema('Legacy Modern', false);
    await seed(db, modernSchema, false, legacySchema('Modern'));
    await seed(db, modernSchema, false, currentModernSchema);
    await seed(db, legacyModernSchema, true, legacySchema('Legacy Modern'));

    const currentCompactSchema = declarativeSchema('Compact');
    const legacyCompactSchema = declarativeSchema('Legacy Compact', false);
    await seed(db, currentCompactSchema, false, legacySchema('Compact'));
    await seed(db, legacyCompactSchema, true, legacySchema('Legacy Compact'));

    await db.run(
      `
      UPDATE invoices
      SET "layoutId" = (
        SELECT "id"
        FROM layouts
        WHERE "schema" = CASE COALESCE(
          (SELECT "layout" FROM invoice_customizations WHERE "parentInvoiceId" = invoices."id"),
          'classic'
        )
          WHEN 'modern' THEN CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM invoice_bank_snapshots WHERE "parentInvoiceId" = invoices."id"
            ) AND EXISTS (
              SELECT 1
              FROM invoice_business_snapshots
              WHERE "parentInvoiceId" = invoices."id"
                AND COALESCE("businessPaymentInformation", '') <> ''
            ) THEN ?
            ELSE ?
          END
          WHEN 'compact' THEN CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM invoice_bank_snapshots WHERE "parentInvoiceId" = invoices."id"
            ) AND EXISTS (
              SELECT 1
              FROM invoice_business_snapshots
              WHERE "parentInvoiceId" = invoices."id"
                AND COALESCE("businessPaymentInformation", '') <> ''
            ) THEN ?
            ELSE ?
          END
          ELSE CASE
            WHEN NOT EXISTS (
              SELECT 1 FROM invoice_bank_snapshots WHERE "parentInvoiceId" = invoices."id"
            ) AND EXISTS (
              SELECT 1
              FROM invoice_business_snapshots
              WHERE "parentInvoiceId" = invoices."id"
                AND COALESCE("businessPaymentInformation", '') <> ''
            ) THEN ?
            ELSE ?
          END
        END
      )
      WHERE "layoutId" IS NULL
    `,
      [legacyModernSchema, modernSchema, legacyCompactSchema, currentCompactSchema, legacyClassicSchema, classicSchema]
    );

    await db.run(`
      INSERT INTO invoice_layout_snapshots ("parentInvoiceId", "layoutSchema")
      SELECT invoices."id", layouts."schema"
      FROM invoices
      INNER JOIN layouts ON layouts."id" = invoices."layoutId"
      WHERE NOT EXISTS (
        SELECT 1
        FROM invoice_layout_snapshots
        WHERE "parentInvoiceId" = invoices."id"
      )
    `);
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
