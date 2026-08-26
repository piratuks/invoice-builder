import type { Response } from '../../shared/types/response';
import type { EInvoice } from '../enums/einvoice';
import { InvoiceStatus } from '../enums/invoiceStatus';
import { InvoiceType } from '../enums/invoiceType';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { EntityWithId } from '../types/entityWithId';
import type {
  CustomField,
  CustomFieldMeta,
  Invoice,
  InvoiceAttachment,
  InvoiceBankSnapshots,
  InvoiceBusinessSnapshots,
  InvoiceClientSnapshots,
  InvoiceCurrencySnapshots,
  InvoiceCustomization,
  InvoiceItem,
  InvoiceItemSnapshots,
  InvoicePayment,
  InvoiceSequence,
  InvoiceStyleProfileSnapshots
} from '../types/invoice';
import type { FilterData } from '../types/invoiceFilter';
import { getDefaultValue } from '../utils/dbHelper';
import { generateInvoiceXML } from '../utils/einvoice/xmlProfiles';
import { mapDatabaseError } from '../utils/errorFunctions';
import { getWhereClauseFromFilters } from '../utils/filterFunctions';

type GetInvoicesOptions = {
  id?: number;
  type?: 'invoice' | 'quotation';
  filter?: FilterData[];
};

type NextSequenceData = {
  nextSequence: number;
  formattedSequence: string;
};

const numericInvoicePattern = /^\d+$/;

const invoiceCurrencySnapshotsFields: (keyof InvoiceCurrencySnapshots)[] = [
  'parentInvoiceId',
  'currencyCode',
  'currencySymbol',
  'currencySubunit'
];
const invoiceClientSnapshotsFields: (keyof InvoiceClientSnapshots)[] = [
  'parentInvoiceId',
  'clientName',
  'clientAddress',
  'clientEmail',
  'clientPhone',
  'clientCode',
  'clientAdditional',
  'clientVatCode',
  'clientPeppolEndpointId',
  'clientCountryCode',
  'clientPeppolEndpointSchemeId',
  'clientBuyerReference'
];
const invoiceBankSnapshotsFields: (keyof InvoiceBankSnapshots)[] = [
  'parentInvoiceId',
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
  'qrCodeFileName'
];
const invoiceBusinessSnapshotsFields: (keyof InvoiceBusinessSnapshots)[] = [
  'parentInvoiceId',
  'businessName',
  'businessAddress',
  'businessRole',
  'businessShortName',
  'businessEmail',
  'businessPhone',
  'businessAdditional',
  'businessVatCode',
  'businessPeppolEndpointId',
  'businessCountryCode',
  'businessCode',
  'businessPeppolEndpointSchemeId',
  // Legacy payment info. New payment info is via Bank
  // 'businessPaymentInformation',
  'businessLogo',
  'businessFileSize',
  'businessFileType',
  'businessFileName'
];
const invoiceStyleProfileSnapshotsFields: (keyof InvoiceStyleProfileSnapshots)[] = [
  'parentInvoiceId',
  'styleProfileName'
];
const invoiceCustomizationFields: (keyof InvoiceCustomization)[] = [
  'parentInvoiceId',
  'color',
  'logoSize',
  'fontSize',
  'fontFamily',
  'layout',
  'tableHeaderStyle',
  'tableRowStyle',
  'pageFormat',
  'labelUpperCase',
  'watermarkFileName',
  'watermarkFileType',
  'watermarkFileSize',
  'watermarkFileData',
  'paidWatermarkFileName',
  'paidWatermarkFileType',
  'paidWatermarkFileSize',
  'paidWatermarkFileData',
  'showQuantity',
  'showUnit',
  'showRowNo',
  'fieldSortOrders',
  'pdfTexts'
];
const invoiceFields: (keyof Invoice)[] = [
  'invoiceType',
  'convertedFromQuotationId',
  'businessId',
  'clientId',
  'currencyId',
  'issuedAt',
  'dueDate',
  'bankId',
  'invoiceNumber',
  'paidAt',
  'closedAt',
  'isArchived',
  'status',
  'customerNotes',
  'thanksNotes',
  'termsConditionNotes',
  'discountName',
  'invoicePrefix',
  'invoiceSuffix',
  'discountType',
  'discountAmountCents',
  'discountPercent',
  'shippingFeeCents',
  'surchargeName',
  'surchargeAmountCents',
  'surchargeType',
  'surchargePercent',
  'taxName',
  'taxRate',
  'taxType',
  'language',
  'signatureData',
  'signatureSize',
  'signatureType',
  'signatureName',
  'styleProfilesId'
];
const attachmentFields: (keyof InvoiceAttachment)[] = ['parentInvoiceId', 'fileSize', 'fileType', 'fileName', 'data'];
const paymentsFields: (keyof InvoicePayment)[] = ['parentInvoiceId', 'amountCents', 'paidAt', 'paymentMethod', 'notes'];
const itemsFields: (keyof InvoiceItem)[] = [
  'parentInvoiceId',
  'itemId',
  'quantity',
  'taxRate',
  'taxType',
  'customField'
];
const itemsSnapshotFields: (keyof InvoiceItemSnapshots)[] = [
  'parentInvoiceItemId',
  'itemName',
  'unitPriceCents',
  'unitName'
];
const invoiceSequencesFields: (keyof InvoiceSequence)[] = ['nextSequence', 'clientId', 'businessId', 'invoiceType'];

const handleEntity =
  <T extends EntityWithId>(db: DatabaseAdapter, table: string, fields: readonly (keyof T)[]) =>
  async (data: T, isUpdate = false): Promise<Response<number>> => {
    const params = fields.map(key => (data[key] ?? null) as string | number | null);

    try {
      let lastID: number = -1;

      if (isUpdate) {
        const setClause =
          fields.map(f => `"${String(f)}" = ?`).join(', ') +
          `, "updatedAt" = ${getDefaultValue("(datetime('now'))", db.type)}`;

        await db.run(`UPDATE ${table} SET ${setClause} WHERE "id" = ?`, [...params, data.id ?? -1], true);
        lastID = data.id ?? -1;
      } else {
        lastID = await db.run(
          `INSERT INTO ${table} (${fields.map(f => `"${String(f)}"`).join(',')})
           VALUES (${fields.map(() => '?').join(',')})`,
          params,
          true
        );
      }

      return { success: true, data: lastID };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  };

const rollbackOrThrow = async (db: DatabaseAdapter) => {
  try {
    await db.run('ROLLBACK');
  } catch {
    throw new Error(`error.rollbackFailed`);
  }
};

const createInvoiceHandlers = (db: DatabaseAdapter) => ({
  handleInvoice: handleEntity<Invoice>(db, 'invoices', invoiceFields),
  handleInvoiceBankSnapshots: handleEntity<InvoiceBankSnapshots>(
    db,
    'invoice_bank_snapshots',
    invoiceBankSnapshotsFields
  ),
  handleInvoiceBusinessSnapshots: handleEntity<InvoiceBusinessSnapshots>(
    db,
    'invoice_business_snapshots',
    invoiceBusinessSnapshotsFields
  ),
  handleInvoiceClientSnapshots: handleEntity<InvoiceClientSnapshots>(
    db,
    'invoice_client_snapshots',
    invoiceClientSnapshotsFields
  ),
  handleInvoiceCurrencySnapshots: handleEntity<InvoiceCurrencySnapshots>(
    db,
    'invoice_currency_snapshots',
    invoiceCurrencySnapshotsFields
  ),
  handleInvoiceCustomization: handleEntity<InvoiceCustomization>(
    db,
    'invoice_customizations',
    invoiceCustomizationFields
  ),
  handleInvoiceStyleProfileSnapshots: handleEntity<InvoiceStyleProfileSnapshots>(
    db,
    'invoice_style_profile_snapshots',
    invoiceStyleProfileSnapshotsFields
  ),
  handleInvoiceItemSnapshots: handleEntity<InvoiceItemSnapshots>(db, 'invoice_item_snapshots', itemsSnapshotFields),
  handleInvoicePayments: handleEntity<InvoicePayment>(db, 'invoice_payments', paymentsFields),
  handleInvoiceItems: handleEntity<InvoiceItem>(db, 'invoice_items', itemsFields),
  handleAttachments: handleEntity<InvoiceAttachment>(db, 'attachments', attachmentFields),
  handleSequences: handleEntity<InvoiceSequence>(db, 'invoice_sequences', invoiceSequencesFields)
});

const parseNumericInvoiceNumber = (value?: string | null): { numericValue: number; width: number } | undefined => {
  if (!value) return undefined;

  const normalized = value.trim();
  if (!numericInvoicePattern.test(normalized)) return undefined;

  const numericValue = Number(normalized);
  if (!Number.isSafeInteger(numericValue)) return undefined;

  return { numericValue, width: normalized.length };
};

const formatSequenceWithWidth = (nextSequence: number, width?: number) => {
  const raw = nextSequence.toString();
  if (!width || width <= raw.length) return raw;
  return raw.padStart(width, '0');
};

const getSequenceScopeStats = async (
  db: DatabaseAdapter,
  businessId: number,
  clientId: number,
  invoiceType: InvoiceType
): Promise<{ maxNumericValue: number; maxWidth: number }> => {
  const rows = await db.all<{ invoiceNumber: string | null }>(
    `SELECT "invoiceNumber" FROM invoices WHERE "businessId" = ? AND "clientId" = ? AND "invoiceType" = ?`,
    [businessId, clientId, invoiceType]
  );

  let maxNumericValue = 0;
  let maxWidth = 0;

  for (const row of rows) {
    const parsed = parseNumericInvoiceNumber(row.invoiceNumber);
    if (!parsed) continue;

    maxNumericValue = Math.max(maxNumericValue, parsed.numericValue);
    maxWidth = Math.max(maxWidth, parsed.width);
  }

  return { maxNumericValue, maxWidth };
};

const getScopedNextSequence = async (
  db: DatabaseAdapter,
  data: { businessId: number; clientId: number; invoiceNumber?: string; invoiceType: InvoiceType }
): Promise<{ nextSequence: number; paddingWidth?: number }> => {
  const stats = await getSequenceScopeStats(db, data.businessId, data.clientId, data.invoiceType);
  const parsedInvoiceNumber = parseNumericInvoiceNumber(data.invoiceNumber);

  const nextFromHistory = stats.maxNumericValue + 1;
  const nextFromInput = parsedInvoiceNumber ? parsedInvoiceNumber.numericValue + 1 : 1;
  const nextSequence = Math.max(nextFromHistory, nextFromInput, 1);

  const paddingWidth = Math.max(stats.maxWidth, parsedInvoiceNumber?.width ?? 0);

  return {
    nextSequence,
    paddingWidth: paddingWidth > 0 ? paddingWidth : undefined
  };
};

const processItems = async (
  db: DatabaseAdapter,
  handlers: {
    handleInvoiceItems: (data: InvoiceItem) => Promise<Response<number>>;
    handleInvoiceItemSnapshots: (data: InvoiceItemSnapshots) => Promise<Response<number>>;
  },
  parentInvoiceId: number,
  items?: InvoiceItem[] | null
) => {
  for (const item of items ?? []) {
    const r = await handlers.handleInvoiceItems({
      ...item,
      parentInvoiceId,
      customField: item.customField ? JSON.stringify(item.customField) : undefined
    } as unknown as InvoiceItem);
    if (!r.success) {
      await rollbackOrThrow(db);
      return r;
    }
    const newItemId = r.data;
    if (newItemId && item.invoiceItemSnapshot) {
      const ibs = await handlers.handleInvoiceItemSnapshots({
        ...item.invoiceItemSnapshot,
        parentInvoiceItemId: newItemId
      } as unknown as InvoiceItemSnapshots);
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return ibs;
      }
    }
  }
  return { success: true } as Response<number>;
};

const processPayments = async (
  db: DatabaseAdapter,
  handlers: { handleInvoicePayments: (data: InvoicePayment, isUpdate?: boolean) => Promise<Response<number>> },
  parentInvoiceId: number,
  payments?: InvoicePayment[] | null
) => {
  for (const payment of payments ?? []) {
    if (payment.id) {
      const existing = await db.get(`SELECT "id" FROM invoice_payments WHERE "id" = ?`, [payment.id]);
      if (existing) {
        const r = await handlers.handleInvoicePayments({ ...payment, parentInvoiceId } as InvoicePayment, true);
        if (!r.success) {
          await rollbackOrThrow(db);
          return r;
        }
        continue;
      }
    }

    const r = await handlers.handleInvoicePayments({ ...payment, parentInvoiceId } as InvoicePayment);
    if (!r.success) {
      await rollbackOrThrow(db);
      return r;
    }
  }
  return { success: true } as Response<number>;
};

const processAttachments = async (
  db: DatabaseAdapter,
  handlers: { handleAttachments: (data: InvoiceAttachment) => Promise<Response<number>> },
  parentInvoiceId: number,
  attachments?: InvoiceAttachment[] | null
) => {
  for (const attachment of attachments ?? []) {
    const r = await handlers.handleAttachments({ ...attachment, parentInvoiceId } as InvoiceAttachment);
    if (!r.success) {
      await rollbackOrThrow(db);
      return r;
    }
  }
  return { success: true } as Response<number>;
};

const processSequence = async (
  db: DatabaseAdapter,
  handlers: { handleSequences: (data: InvoiceSequence, isUpdate?: boolean) => Promise<Response<number>> },
  data: { clientId: number; businessId: number; invoiceNumber?: string; invoiceType: InvoiceType }
) => {
  const currentSequence = await db.get<InvoiceSequence>(
    `SELECT * FROM invoice_sequences WHERE "businessId" = ? and "clientId" = ? and "invoiceType" = ?`,
    [data.businessId, data.clientId, data.invoiceType]
  );

  if (currentSequence) {
    const r = await handlers.handleSequences(
      {
        id: currentSequence.id,
        businessId: currentSequence.businessId,
        clientId: currentSequence.clientId,
        nextSequence: Number(currentSequence.nextSequence) + 1,
        invoiceType: currentSequence.invoiceType
      } as InvoiceSequence,
      true
    );
    if (!r.success) {
      await rollbackOrThrow(db);
      return r;
    }
  } else {
    const sequenceData = await getScopedNextSequence(db, data);
    const r = await handlers.handleSequences({
      businessId: data.businessId,
      clientId: data.clientId,
      nextSequence: sequenceData.nextSequence,
      invoiceType: data.invoiceType
    } as InvoiceSequence);
    if (!r.success) {
      await rollbackOrThrow(db);
      return r;
    }
  }

  return { success: true } as Response<number>;
};

const processSequenceOnUpdate = async (
  db: DatabaseAdapter,
  handlers: { handleSequences: (data: InvoiceSequence, isUpdate?: boolean) => Promise<Response<number>> },
  data: {
    previousInvoiceNumber?: string;
    previousClientId: number;
    previousBusinessId: number;
    invoiceNumber?: string;
    clientId: number;
    businessId: number;
    invoiceType: InvoiceType;
  }
) => {
  if (
    data.previousInvoiceNumber === data.invoiceNumber &&
    data.previousClientId === data.clientId &&
    data.previousBusinessId === data.businessId
  ) {
    return { success: true } as Response<number>;
  }

  const parsedInvoiceNumber = parseNumericInvoiceNumber(data.invoiceNumber);
  if (!parsedInvoiceNumber) {
    return { success: true } as Response<number>;
  }

  const currentSequence = await db.get<InvoiceSequence>(
    `SELECT * FROM invoice_sequences WHERE "businessId" = ? and "clientId" = ? and "invoiceType" = ?`,
    [data.businessId, data.clientId, data.invoiceType]
  );

  const desiredNextSequence = parsedInvoiceNumber.numericValue + 1;

  if (currentSequence) {
    if (Number(currentSequence.nextSequence) >= desiredNextSequence) {
      return { success: true } as Response<number>;
    }

    const r = await handlers.handleSequences(
      {
        id: currentSequence.id,
        businessId: currentSequence.businessId,
        clientId: currentSequence.clientId,
        nextSequence: desiredNextSequence,
        invoiceType: data.invoiceType
      } as InvoiceSequence,
      true
    );
    if (!r.success) {
      await rollbackOrThrow(db);
      return r;
    }
  } else {
    const r = await handlers.handleSequences({
      businessId: data.businessId,
      clientId: data.clientId,
      nextSequence: desiredNextSequence,
      invoiceType: data.invoiceType
    } as InvoiceSequence);
    if (!r.success) {
      await rollbackOrThrow(db);
      return r;
    }
  }

  return { success: true } as Response<number>;
};

const setPaidAtAndClosedAt = (invoice: Invoice): Invoice => {
  const now = new Date().toISOString();
  if (invoice.status === InvoiceStatus.paid) {
    invoice.paidAt = now;
    invoice.closedAt = undefined;
  } else if (invoice.status === InvoiceStatus.closed) {
    invoice.closedAt = now;
    invoice.paidAt = undefined;
  } else {
    invoice.paidAt = undefined;
    invoice.closedAt = undefined;
  }

  return invoice;
};

type SequenceHandler = (data: InvoiceSequence, isUpdate?: boolean) => Promise<Response<number>>;

const getDuplicateInvoiceNumber = async (
  db: DatabaseAdapter,
  handleSequences: SequenceHandler,
  data: {
    businessId: number;
    clientId: number;
    originalInvoiceNumber?: string;
    originalInvoiceType: InvoiceType;
    targetInvoiceType: InvoiceType;
  }
): Promise<Response<string>> => {
  const { businessId, clientId, originalInvoiceNumber, originalInvoiceType, targetInvoiceType } = data;
  const isQuotationConversion =
    originalInvoiceType === InvoiceType.quotation && targetInvoiceType === InvoiceType.invoice;

  if (isQuotationConversion) {
    if (!originalInvoiceNumber) return { success: false };

    const parsedOriginalNumber = parseNumericInvoiceNumber(originalInvoiceNumber);
    if (!parsedOriginalNumber) return { success: true, data: originalInvoiceNumber };

    const existingInvoice = await db.get<{ id: number }>(
      `SELECT "id" FROM invoices WHERE "businessId" = ? AND "clientId" = ? AND "invoiceType" = ? AND "invoiceNumber" = ?`,
      [businessId, clientId, InvoiceType.invoice, originalInvoiceNumber]
    );
    const invoiceSequence = await db.get<InvoiceSequence>(
      `SELECT * FROM invoice_sequences WHERE "businessId" = ? AND "clientId" = ? AND "invoiceType" = ?`,
      [businessId, clientId, InvoiceType.invoice]
    );
    const invoiceNumber = existingInvoice
      ? Math.max(Number(invoiceSequence?.nextSequence ?? 1), parsedOriginalNumber.numericValue + 1)
      : parsedOriginalNumber.numericValue;
    const nextSequence = invoiceNumber + 1;

    if (invoiceSequence) {
      if (Number(invoiceSequence.nextSequence) < nextSequence) {
        const result = await handleSequences(
          {
            id: invoiceSequence.id,
            businessId,
            clientId,
            nextSequence,
            invoiceType: InvoiceType.invoice
          } as InvoiceSequence,
          true
        );
        if (!result.success) return { success: false };
      }
    } else {
      const result = await handleSequences({
        businessId,
        clientId,
        nextSequence,
        invoiceType: InvoiceType.invoice
      } as InvoiceSequence);
      if (!result.success) return { success: false };
    }

    const width = existingInvoice
      ? Math.max(
          parsedOriginalNumber.width,
          invoiceSequence ? (await getSequenceScopeStats(db, businessId, clientId, InvoiceType.invoice)).maxWidth : 0
        )
      : parsedOriginalNumber.width;

    return {
      success: true,
      data: existingInvoice ? formatSequenceWithWidth(invoiceNumber, width) : originalInvoiceNumber
    };
  }

  const sequenceRow = await db.get<InvoiceSequence>(
    `SELECT * FROM invoice_sequences WHERE "businessId" = ? AND "clientId" = ? AND "invoiceType" = ?`,
    [businessId, clientId, originalInvoiceType]
  );

  if (sequenceRow) {
    const nextSequence = Number(sequenceRow.nextSequence);
    const { maxWidth } = await getSequenceScopeStats(db, businessId, clientId, originalInvoiceType);
    const result = await handleSequences(
      {
        id: sequenceRow.id,
        businessId: sequenceRow.businessId,
        clientId: sequenceRow.clientId,
        nextSequence: nextSequence + 1,
        invoiceType: sequenceRow.invoiceType
      } as InvoiceSequence,
      true
    );
    if (!result.success) return { success: false };
    return { success: true, data: formatSequenceWithWidth(nextSequence, maxWidth > 0 ? maxWidth : undefined) };
  }

  const sequenceData = await getScopedNextSequence(db, {
    businessId,
    clientId,
    invoiceNumber: originalInvoiceNumber,
    invoiceType: originalInvoiceType
  });
  const result = await handleSequences({
    businessId,
    clientId,
    nextSequence: sequenceData.nextSequence + 1,
    invoiceType: originalInvoiceType
  } as InvoiceSequence);
  if (!result.success) return { success: false };

  return { success: true, data: formatSequenceWithWidth(sequenceData.nextSequence, sequenceData.paddingWidth) };
};

const getInvoices = async (db: DatabaseAdapter, options: GetInvoicesOptions) => {
  const { id, type, filter } = options;

  const whereClause = filter
    ? getWhereClauseFromFilters({
        filters: filter,
        businessNameSnapshotColumn: 'ibs."businessName"',
        clientNameSnapshotColumn: 'ics."clientName"',
        archivedColumn: 'i."isArchived"',
        issuedAtColumn: 'i."issuedAt"',
        statusColumn: 'i."status"'
      })
    : '';

  const conditions: string[] = [];
  if (id) conditions.push(`i."id" = ${id}`);
  if (type) conditions.push(`i."invoiceType" = '${type}'`);
  if (whereClause) conditions.push(whereClause);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const invoicesSql = `
        SELECT i.*, c."format" as "currencyFormat"
        FROM invoices i
        INNER JOIN currencies as c on c."id" = i."currencyId"
        INNER JOIN invoice_business_snapshots as ibs on ibs."parentInvoiceId" = i."id"
        INNER JOIN invoice_client_snapshots as ics on ics."parentInvoiceId" = i."id"
        ${whereSql}
        ORDER BY i."createdAt" DESC
      `;
  const invoices = await db.all<Invoice>(invoicesSql);

  const invoiceIds = invoices.map(i => i.id) as number[];

  if (invoiceIds.length === 0) {
    return [];
  }

  const placeholders = invoiceIds.map(() => '?').join(', ');

  const [
    invoicePayments,
    invoiceItems,
    invoiceAttachments,
    invoiceBusinessSnapshots,
    invoiceClientSnapshots,
    invoiceCurrencySnapshots,
    invoiceCustomization,
    invoiceStyleProfileSnapshots,
    invoiceBankSnapshots
  ] = await Promise.all([
    db.all<InvoicePayment>(`SELECT * FROM invoice_payments WHERE "parentInvoiceId" IN (${placeholders})`, invoiceIds),
    db.all<InvoiceItem>(`SELECT * FROM invoice_items WHERE "parentInvoiceId" IN (${placeholders})`, invoiceIds),
    db.all<InvoiceAttachment>(`SELECT * FROM attachments WHERE "parentInvoiceId" IN (${placeholders})`, invoiceIds),
    db.all<InvoiceBusinessSnapshots>(
      `SELECT * FROM invoice_business_snapshots WHERE "parentInvoiceId" IN (${placeholders})`,
      invoiceIds
    ),
    db.all<InvoiceClientSnapshots>(
      `SELECT * FROM invoice_client_snapshots WHERE "parentInvoiceId" IN (${placeholders})`,
      invoiceIds
    ),
    db.all<InvoiceCurrencySnapshots>(
      `SELECT * FROM invoice_currency_snapshots WHERE "parentInvoiceId" IN (${placeholders})`,
      invoiceIds
    ),
    db.all<InvoiceCustomization>(
      `SELECT * FROM invoice_customizations WHERE "parentInvoiceId" IN (${placeholders})`,
      invoiceIds
    ),
    db.all<InvoiceStyleProfileSnapshots>(
      `SELECT * FROM invoice_style_profile_snapshots WHERE "parentInvoiceId" IN (${placeholders})`,
      invoiceIds
    ),
    db.all<InvoiceBankSnapshots>(
      `SELECT * FROM invoice_bank_snapshots WHERE "parentInvoiceId" IN (${placeholders})`,
      invoiceIds
    )
  ]);

  const invoiceItemIds = invoiceItems.map(i => i.id) as number[];
  const placeholdersItems = invoiceItemIds.map(() => '?').join(', ');
  const invoiceItemSnapshots = await db.all<InvoiceItemSnapshots>(
    `SELECT sps.* FROM invoice_item_snapshots as sps WHERE "parentInvoiceItemId" IN (${placeholdersItems})`,
    invoiceItemIds
  );

  return invoices.map(invoice => {
    const specificCustomization = invoiceCustomization.find(p => p.parentInvoiceId === invoice.id);

    return {
      ...invoice,
      invoicePayments: invoicePayments.filter(p => p.parentInvoiceId === invoice.id),
      invoiceItems: invoiceItems
        .filter(p => p.parentInvoiceId === invoice.id)
        .map(p => {
          return {
            ...p,
            invoiceItemSnapshot: invoiceItemSnapshots.find(iis => iis.parentInvoiceItemId === p.id),
            customField: p.customField && typeof p.customField === 'string' ? JSON.parse(p.customField) : p.customField
          };
        }),
      invoiceAttachments: invoiceAttachments.filter(p => p.parentInvoiceId === invoice.id),
      invoiceBankSnapshot: invoiceBankSnapshots.find(p => p.parentInvoiceId === invoice.id),
      invoiceBusinessSnapshot: invoiceBusinessSnapshots.find(p => p.parentInvoiceId === invoice.id),
      invoiceClientSnapshot: invoiceClientSnapshots.find(p => p.parentInvoiceId === invoice.id),
      invoiceCurrencySnapshot: invoiceCurrencySnapshots.find(p => p.parentInvoiceId === invoice.id),
      invoiceCustomization: specificCustomization
        ? {
            ...specificCustomization,
            pdfTexts:
              specificCustomization.pdfTexts && typeof specificCustomization.pdfTexts === 'string'
                ? JSON.parse(specificCustomization.pdfTexts)
                : specificCustomization.pdfTexts,
            fieldSortOrders:
              specificCustomization.fieldSortOrders && typeof specificCustomization.fieldSortOrders === 'string'
                ? JSON.parse(specificCustomization.fieldSortOrders)
                : specificCustomization.fieldSortOrders
          }
        : specificCustomization,
      invoiceStyleProfileSnapshot: invoiceStyleProfileSnapshots.find(p => p.parentInvoiceId === invoice.id)
    };
  });
};

export const getInvoiceXML = async (db: DatabaseAdapter, data: { invoiceId: number; einvoice: EInvoice }) => {
  const { invoiceId, einvoice } = data;
  const invoiceResult = await getInvoices(db, { id: invoiceId });

  if (invoiceResult.length <= 0) {
    throw new Error('error.invoiceNotFound');
  }

  const invoice = invoiceResult[0];
  const xmlData = generateInvoiceXML(einvoice, invoice);

  return { success: true, data: xmlData };
};

export const getNextSequence = async (
  db: DatabaseAdapter,
  data: { businessId: number; clientId: number; invoiceType: InvoiceType }
): Promise<Response<NextSequenceData | undefined>> => {
  const currentSequence = await db.get<InvoiceSequence>(
    `SELECT * FROM invoice_sequences WHERE "businessId" = ? and "clientId" = ? and "invoiceType" = ?`,
    [data.businessId, data.clientId, data.invoiceType]
  );

  if (!currentSequence) {
    return { success: true, data: undefined };
  }

  const nextSequence = Number(currentSequence.nextSequence);
  const { maxWidth } = await getSequenceScopeStats(db, data.businessId, data.clientId, data.invoiceType);

  return {
    success: true,
    data: {
      nextSequence,
      formattedSequence: formatSequenceWithWidth(nextSequence, maxWidth > 0 ? maxWidth : undefined)
    }
  };
};

export const getCustomHeaders = async (db: DatabaseAdapter, type: 'invoice' | 'quotation') => {
  const rows = await db.all<{ customField: string | null }>(
    `
    SELECT ii."customField"
      FROM invoice_items ii
      INNER JOIN invoices as i on i."id" = ii."parentInvoiceId"
      WHERE i."invoiceType" = ?
      GROUP BY ii."customField"
    `,
    [type]
  );
  const headersMeta: CustomFieldMeta[] = [];
  rows.map(row => {
    const parsed = row.customField ? (JSON.parse(row.customField) as CustomField) : null;
    if (parsed && !headersMeta.some(h => h.header === parsed.header)) {
      headersMeta.push({
        header: parsed.header,
        sortOrder: parsed.sortOrder,
        alignment: parsed.alignment
      });
    }
  });
  return { success: true, data: headersMeta };
};

export const getAllInvoices = async (db: DatabaseAdapter, type?: 'invoice' | 'quotation', filter?: FilterData[]) => {
  const finalInvoices = await getInvoices(db, { type, filter });
  return { success: true, data: finalInvoices };
};

export const deleteInvoice = async (db: DatabaseAdapter, id: number) => {
  try {
    await db.run('DELETE FROM invoices WHERE "id" = ?;', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const addInvoice = async (db: DatabaseAdapter, data: Invoice) => {
  const {
    handleInvoice,
    handleInvoiceBankSnapshots,
    handleInvoiceBusinessSnapshots,
    handleInvoiceClientSnapshots,
    handleInvoiceCurrencySnapshots,
    handleInvoiceCustomization,
    handleInvoiceStyleProfileSnapshots,
    handleInvoiceItemSnapshots,
    handleInvoicePayments,
    handleInvoiceItems,
    handleAttachments,
    handleSequences
  } = createInvoiceHandlers(db);

  try {
    await db.run('BEGIN');

    const formatedData = setPaidAtAndClosedAt(data);

    const result = await handleInvoice(formatedData);

    if (!result.success || result.data == undefined) {
      await rollbackOrThrow(db);
      return { success: false, key: result.key };
    }

    const newId = result.data;
    if (data.styleProfilesId != undefined && data.invoiceStyleProfileSnapshot) {
      const ibs = await handleInvoiceStyleProfileSnapshots({
        ...data.invoiceStyleProfileSnapshot,
        parentInvoiceId: newId
      });
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.invoiceCustomization) {
      const ibs = await handleInvoiceCustomization({
        ...data.invoiceCustomization,
        parentInvoiceId: newId,
        fieldSortOrders: JSON.stringify(data.invoiceCustomization.fieldSortOrders),
        pdfTexts: JSON.stringify(data.invoiceCustomization.pdfTexts)
      });
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.currencyId != undefined && data.invoiceCurrencySnapshot) {
      const ibs = await handleInvoiceCurrencySnapshots({
        ...data.invoiceCurrencySnapshot,
        parentInvoiceId: newId
      });
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.bankId != undefined && data.invoiceBankSnapshot) {
      const ibs = await handleInvoiceBankSnapshots({
        ...data.invoiceBankSnapshot,
        parentInvoiceId: newId
      });
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.businessId != undefined && data.invoiceBusinessSnapshot) {
      const ibs = await handleInvoiceBusinessSnapshots({
        ...data.invoiceBusinessSnapshot,
        parentInvoiceId: newId
      });
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.clientId != undefined && data.invoiceClientSnapshot) {
      const ibs = await handleInvoiceClientSnapshots({
        ...data.invoiceClientSnapshot,
        parentInvoiceId: newId
      });
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }

    const itemsResult = await processItems(
      db,
      { handleInvoiceItems, handleInvoiceItemSnapshots },
      newId,
      data.invoiceItems
    );
    if (!itemsResult.success) {
      return { success: false, key: itemsResult.key, message: itemsResult.message };
    }

    const paymentsResult = await processPayments(db, { handleInvoicePayments }, newId, data.invoicePayments);
    if (!paymentsResult.success) {
      return { success: false, key: paymentsResult.key, message: paymentsResult.message };
    }

    const attachmentsResult = await processAttachments(db, { handleAttachments }, newId, data.invoiceAttachments);
    if (!attachmentsResult.success) {
      return { success: false, key: attachmentsResult.key, message: attachmentsResult.message };
    }

    const newResult = await getInvoices(db, { id: newId });

    await db.run('COMMIT');

    const resultSequence = await processSequence(
      db,
      { handleSequences },
      {
        clientId: data.clientId,
        businessId: data.businessId,
        invoiceNumber: data.invoiceNumber,
        invoiceType: data.invoiceType
      }
    );
    if (!resultSequence.success) {
      await rollbackOrThrow(db);
      return { success: false, key: result.key };
    }

    return { success: true, data: newResult.length > 0 ? newResult[0] : newResult };
  } catch (error) {
    await rollbackOrThrow(db);
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const updateInvoice = async (db: DatabaseAdapter, data: Invoice) => {
  const {
    handleInvoice,
    handleInvoicePayments,
    handleAttachments,
    handleInvoiceBusinessSnapshots,
    handleInvoiceBankSnapshots,
    handleInvoiceStyleProfileSnapshots,
    handleInvoiceClientSnapshots,
    handleInvoiceCurrencySnapshots,
    handleInvoiceCustomization,
    handleInvoiceItems,
    handleInvoiceItemSnapshots,
    handleSequences
  } = createInvoiceHandlers(db);

  try {
    await db.run('BEGIN');

    const currentInvoice = await db.get<Invoice>(`SELECT * FROM invoices WHERE "id" = ?`, [data.id]);
    if (!currentInvoice) {
      await rollbackOrThrow(db);
      return { success: false, key: 'error.invoiceNotFound' };
    }

    const formatedData = setPaidAtAndClosedAt(data);

    const result = await handleInvoice(formatedData, true);
    if (!result.success || !data.id) {
      await rollbackOrThrow(db);
      return { success: false, key: result.key };
    }

    if (data.styleProfilesId != undefined && data.invoiceStyleProfileSnapshot) {
      const ibs = await handleInvoiceStyleProfileSnapshots(
        {
          ...data.invoiceStyleProfileSnapshot,
          parentInvoiceId: data.id
        },
        data.invoiceStyleProfileSnapshot.id != undefined
      );
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.invoiceCustomization) {
      const ibs = await handleInvoiceCustomization(
        {
          ...data.invoiceCustomization,
          parentInvoiceId: data.id,
          fieldSortOrders: JSON.stringify(data.invoiceCustomization.fieldSortOrders),
          pdfTexts: JSON.stringify(data.invoiceCustomization.pdfTexts)
        },
        data.invoiceCustomization.id != undefined
      );
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.currencyId != undefined && data.invoiceCurrencySnapshot) {
      const ibs = await handleInvoiceCurrencySnapshots(
        {
          ...data.invoiceCurrencySnapshot,
          parentInvoiceId: data.id
        },
        data.invoiceCurrencySnapshot.id != undefined
      );
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.bankId != undefined && data.invoiceBankSnapshot) {
      const ibs = await handleInvoiceBankSnapshots(
        {
          ...data.invoiceBankSnapshot,
          parentInvoiceId: data.id
        },
        data.invoiceBankSnapshot.id != undefined
      );
      if (!ibs.success) {
        await rollbackOrThrow(db);
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.businessId != undefined && data.invoiceBusinessSnapshot) {
      const ibs = await handleInvoiceBusinessSnapshots(
        {
          ...data.invoiceBusinessSnapshot,
          parentInvoiceId: data.id
        },
        data.invoiceBusinessSnapshot.id != undefined
      );
      if (!ibs.success) {
        try {
          await db.run('ROLLBACK');
        } catch {
          throw new Error(`error.rollbackFailed`);
        }
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }
    if (data.clientId != undefined && data.invoiceClientSnapshot) {
      const ibs = await handleInvoiceClientSnapshots(
        {
          ...data.invoiceClientSnapshot,
          parentInvoiceId: data.id
        },
        data.invoiceClientSnapshot.id != undefined
      );
      if (!ibs.success) {
        try {
          await db.run('ROLLBACK');
        } catch {
          throw new Error(`error.rollbackFailed`);
        }
        return { success: false, key: ibs.key, message: ibs.message };
      }
    }

    await db.run('DELETE FROM invoice_items WHERE "parentInvoiceId" = ?;', [data.id]);

    const itemsResult = await processItems(
      db,
      { handleInvoiceItems, handleInvoiceItemSnapshots },
      data.id,
      data.invoiceItems
    );
    if (!itemsResult.success) {
      return { success: false, key: itemsResult.key, message: itemsResult.message };
    }

    const ids = (data.invoicePayments ?? []).map(p => p.id).filter(Boolean);
    if (ids.length > 0) {
      await db.run(
        `DELETE FROM invoice_payments WHERE "parentInvoiceId" = ? AND "id" NOT IN (${ids.map(() => '?').join(',')})`,
        [data.id, ...ids]
      );
    } else {
      await db.run(`DELETE FROM invoice_payments WHERE "parentInvoiceId" = ?`, [data.id]);
    }

    const paymentsResult = await processPayments(db, { handleInvoicePayments }, data.id, data.invoicePayments);
    if (!paymentsResult.success) {
      return { success: false, key: paymentsResult.key, message: paymentsResult.message };
    }

    await db.run('DELETE FROM attachments WHERE "parentInvoiceId" = ?;', [data.id]);
    const attachmentsResult = await processAttachments(db, { handleAttachments }, data.id, data.invoiceAttachments);
    if (!attachmentsResult.success) {
      return { success: false, key: attachmentsResult.key, message: attachmentsResult.message };
    }

    const newResult = await getInvoices(db, { id: data.id });

    await db.run('COMMIT');

    const resultSequence = await processSequenceOnUpdate(
      db,
      { handleSequences },
      {
        previousInvoiceNumber: currentInvoice.invoiceNumber,
        previousClientId: currentInvoice.clientId,
        previousBusinessId: currentInvoice.businessId,
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        businessId: data.businessId,
        invoiceType: data.invoiceType as InvoiceType
      }
    );
    if (!resultSequence.success) {
      await rollbackOrThrow(db);
      return { success: false, key: result.key };
    }

    return { success: true, data: newResult.length > 0 ? newResult[0] : newResult };
  } catch (error) {
    await rollbackOrThrow(db);
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};

export const duplicateInvoice = async (
  db: DatabaseAdapter,
  invoiceId: number,
  invoiceType: 'quotation' | 'invoice'
) => {
  try {
    await db.run('BEGIN');

    const original = await db.get('SELECT * FROM invoices WHERE "id" = ?;', [invoiceId]);

    if (!original) return { success: false };

    const businessId = Number(original.businessId);
    const clientId = Number(original.clientId);
    const originalInvoiceNumber = typeof original.invoiceNumber === 'string' ? original.invoiceNumber : undefined;

    let convertedFromQuotationId: number | null = original.convertedFromQuotationId as number | null;
    const status: string = InvoiceStatus.unpaid;
    const isQuotationConversion = original.invoiceType === 'quotation' && invoiceType === 'invoice';
    if (isQuotationConversion) {
      convertedFromQuotationId = original.id as number;
      await db.run(`UPDATE invoices SET "status" = 'closed' WHERE "id" = ?;`, [original.id as number]);
    }

    const handleSequences = handleEntity<InvoiceSequence>(db, 'invoice_sequences', invoiceSequencesFields);
    const numberResult = await getDuplicateInvoiceNumber(db, handleSequences, {
      businessId,
      clientId,
      originalInvoiceNumber,
      originalInvoiceType: original.invoiceType as InvoiceType,
      targetInvoiceType: invoiceType as InvoiceType
    });
    if (!numberResult.success || numberResult.data === undefined) {
      await rollbackOrThrow(db);
      return { success: false };
    }
    const newInvoiceNumber = numberResult.data;

    const insertInvoiceSQL = `
        INSERT INTO invoices (
          "invoiceType", "convertedFromQuotationId", "businessId", "clientId", "currencyId",
          "issuedAt", "dueDate", "invoiceNumber", "isArchived", "status", "customerNotes",
          "thanksNotes", "termsConditionNotes", "discountName", "language", 
          "discountType", "discountAmountCents", "discountPercent", "shippingFeeCents",
          "invoicePrefix", "invoiceSuffix", "taxName", "taxRate", "taxType", "signatureData",
          "signatureSize", "signatureType", "signatureName", "styleProfilesId", "bankId", 
          "surchargeName", "surchargeAmountCents", "surchargePercent", "surchargeType"
        )
        SELECT
          ?, ?, "businessId", "clientId", "currencyId",
          ${getDefaultValue("(datetime('now'))", db.type)},  
          CASE 
            WHEN "dueDate" IS NULL THEN NULL
            ELSE ${getDefaultValue("date('now','start of month','+2 months','-1 day')", db.type)}
            END, ?, 0, ?, "customerNotes",
          "thanksNotes", "termsConditionNotes", "discountName", "language", 
          "discountType", "discountAmountCents", "discountPercent", "shippingFeeCents",
          "invoicePrefix", "invoiceSuffix", "taxName", "taxRate", "taxType", "signatureData",
          "signatureSize", "signatureType", "signatureName", "styleProfilesId", "bankId",
          "surchargeName", "surchargeAmountCents", "surchargePercent", "surchargeType"
        FROM invoices WHERE "id" = ?
      `;

    let duplicatedRowID: number | void = await db.run(
      insertInvoiceSQL,
      [invoiceType, convertedFromQuotationId, newInvoiceNumber, status, invoiceId],
      true
    );
    duplicatedRowID = typeof duplicatedRowID === 'number' ? duplicatedRowID : -1;

    const duplicateSnapshot = async (table: string, columns: string[]) => {
      const columnList = columns.map(c => `"${c}"`).join(', ');

      const sql = `
        INSERT INTO ${table} ("parentInvoiceId", ${columnList})
        SELECT ?, ${columnList}
        FROM ${table}
        WHERE "parentInvoiceId" = ?;
      `;

      await db.run(sql, [duplicatedRowID, invoiceId]);
    };

    await duplicateSnapshot('invoice_bank_snapshots', [
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
      'qrCodeFileName'
    ]);
    await duplicateSnapshot('invoice_business_snapshots', [
      'businessName',
      'businessShortName',
      'businessAddress',
      'businessRole',
      'businessEmail',
      'businessPhone',
      'businessAdditional',
      'businessVatCode',
      'businessPeppolEndpointId',
      'businessCountryCode',
      'businessCode',
      'businessPeppolEndpointSchemeId',
      // Legacy payment info. New payment info is via Bank
      // 'businessPaymentInformation',
      'businessLogo',
      'businessFileSize',
      'businessFileType',
      'businessFileName'
    ]);
    await duplicateSnapshot('invoice_client_snapshots', [
      'clientName',
      'clientAddress',
      'clientEmail',
      'clientPhone',
      'clientCode',
      'clientVatCode',
      'clientPeppolEndpointId',
      'clientCountryCode',
      'clientPeppolEndpointSchemeId',
      'clientBuyerReference',
      'clientAdditional'
    ]);
    await duplicateSnapshot('invoice_currency_snapshots', ['currencyCode', 'currencySymbol', 'currencySubunit']);
    await duplicateSnapshot('invoice_customizations', [
      'color',
      'logoSize',
      'fontSize',
      'fontFamily',
      'layout',
      'tableHeaderStyle',
      'tableRowStyle',
      'pageFormat',
      'labelUpperCase',
      'watermarkFileName',
      'watermarkFileType',
      'watermarkFileSize',
      'watermarkFileData',
      'paidWatermarkFileName',
      'paidWatermarkFileType',
      'paidWatermarkFileSize',
      'paidWatermarkFileData',
      'showQuantity',
      'showUnit',
      'showRowNo',
      'fieldSortOrders',
      'pdfTexts'
    ]);
    await duplicateSnapshot('invoice_style_profile_snapshots', ['styleProfileName']);

    await db.run(
      `INSERT INTO invoice_items ("parentInvoiceId", "itemId", "quantity", "taxRate", "taxType", "customField")
       SELECT ?, "itemId", "quantity", "taxRate", "taxType", "customField"
       FROM invoice_items WHERE "parentInvoiceId" = ?;`,
      [duplicatedRowID, invoiceId]
    );

    await db.run(
      `INSERT INTO invoice_item_snapshots (
        "parentInvoiceItemId",
        "itemName",
        "unitPriceCents",
        "unitName"
      )
      SELECT
        "newItems"."id",
        snap."itemName",
        snap."unitPriceCents",
        snap."unitName"
      FROM invoice_item_snapshots AS snap
      JOIN invoice_items AS "oldItems"
        ON snap."parentInvoiceItemId" = "oldItems"."id"
      JOIN invoice_items AS "newItems"
       ON "newItems"."itemId" = "oldItems"."itemId"
       AND "newItems"."parentInvoiceId" = ?
      WHERE "oldItems"."parentInvoiceId" = ?;`,
      [duplicatedRowID, invoiceId]
    );

    await db.run(
      `INSERT INTO attachments ("parentInvoiceId", "fileName", "fileType", "fileSize", "data")
       SELECT ?, "fileName", "fileType", "fileSize", "data" FROM attachments WHERE "parentInvoiceId" = ?;`,
      [duplicatedRowID, invoiceId]
    );

    let duplicated = [];
    if (isQuotationConversion) {
      duplicated = await getInvoices(db, { id: original.id as number });
    } else {
      duplicated = await getInvoices(db, { id: duplicatedRowID });
    }
    await db.run('COMMIT');
    return { success: true, data: duplicated.length > 0 ? duplicated[0] : duplicated };
  } catch (error) {
    await rollbackOrThrow(db);
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
