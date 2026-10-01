import type {
  Bank,
  BankWeb,
  Business,
  BusinessWeb,
  InvoiceBankSnapshots,
  InvoiceBusinessSnapshots,
  PresetWeb,
  Response
} from '@invoice-builder/contracts';
import type { StyleProfileWeb } from '@invoice-builder/contracts';
import type { EntityWithCounts } from '../types/entityWithCounts';
import type { InvoiceCustomizationRow, InvoiceRow } from '../types/invoice';
import type { PresetRow } from '../types/preset';

import type { StyleProfileRow } from '../types/styleProfiles';
import { fromBase64 } from './generalFunctions';

export const decodeLogo = <T extends { logo?: unknown }>(data: T) => ({
  ...data,
  logo: data.logo ? fromBase64(data.logo as string) : null
});

export const encodeLogo = (data?: (Business & EntityWithCounts) | null): BusinessWeb | null | undefined => {
  if (!data) return data;
  const buf = data.logo as Buffer | null;
  return { ...data, logo: buf ? buf.toString('base64') : null };
};

export const encodePreset = (data?: PresetRow | null, skip: boolean = false) => {
  if (!data) return data;
  const bufSignature = data.signatureData as Buffer | null;
  const bufLogo = data.businessLogo as Buffer | null;
  const bufQrCode = data.qrCode as Buffer | null;
  const bufWatermarkFileData = data.styleProfileWatermarkFileData as Buffer | null;
  const bufPaidWatermarkFileData = data.styleProfilePaidWatermarkFileData as Buffer | null;
  return {
    ...data,
    signatureData: bufSignature ? bufSignature.toString('base64') : null,
    ...(!skip
      ? {
          businessLogo: bufLogo ? bufLogo.toString('base64') : null,
          qrCode: bufQrCode ? bufQrCode.toString('base64') : null,
          styleProfileWatermarkFileData: bufWatermarkFileData ? bufWatermarkFileData.toString('base64') : null,
          styleProfilePaidWatermarkFileData: bufPaidWatermarkFileData
            ? bufPaidWatermarkFileData.toString('base64')
            : null
        }
      : {})
  };
};

export const decodePreset = <
  T extends {
    signatureData?: unknown;
    businessLogo?: unknown;
    qrCode?: unknown;
    styleProfilePaidWatermarkFileData?: unknown;
    styleProfileWatermarkFileData?: unknown;
  }
>(
  data: T,
  skip: boolean = false
) => ({
  ...data,
  signatureData: data.signatureData ? fromBase64(data.signatureData as string) : null,
  ...(!skip
    ? {
        businessLogo: data.businessLogo ? fromBase64(data.businessLogo as string) : null,
        qrCode: data.qrCode ? fromBase64(data.qrCode as string) : null,
        styleProfileWatermarkFileData: data.styleProfileWatermarkFileData
          ? fromBase64(data.styleProfileWatermarkFileData as string)
          : null,
        styleProfilePaidWatermarkFileData: data.styleProfilePaidWatermarkFileData
          ? fromBase64(data.styleProfilePaidWatermarkFileData as string)
          : null
      }
    : {})
});

export const encodeResultPreset = (result: Response<PresetRow[] | PresetRow>): Response<PresetWeb[] | PresetWeb> => ({
  ...result,
  data: Array.isArray(result.data)
    ? result.data.map(item => encodePreset(item) as PresetWeb)
    : result.data
      ? (encodePreset(result.data) as PresetWeb)
      : undefined
});

export const encodeResultBusiness = (
  result: Response<(Business & EntityWithCounts)[] | (Business & EntityWithCounts)>
): Response<BusinessWeb[] | BusinessWeb> => ({
  ...result,
  data: Array.isArray(result.data)
    ? result.data.map(item => encodeLogo(item) as BusinessWeb)
    : result.data
      ? (encodeLogo(result.data) as BusinessWeb)
      : undefined
});

export const decodeBank = <T extends { qrCode?: unknown }>(data: T) => ({
  ...data,
  qrCode: data.qrCode ? fromBase64(data.qrCode as string) : null
});

export const encodeBank = (data?: (Bank & EntityWithCounts) | null): BankWeb | null | undefined => {
  if (!data) return data;
  const bufQrCode = data.qrCode as Buffer | null;
  return {
    ...data,
    qrCode: bufQrCode ? bufQrCode.toString('base64') : null
  };
};

export const encodeResultBank = (
  result: Response<(Bank & EntityWithCounts)[] | (Bank & EntityWithCounts)>
): Response<BankWeb[] | BankWeb> => ({
  ...result,
  data: Array.isArray(result.data)
    ? result.data.map(item => encodeBank(item) as BankWeb)
    : result.data
      ? (encodeBank(result.data) as BankWeb)
      : undefined
});

export const decodeStyleProfile = <T extends { paidWatermarkFileData?: unknown; watermarkFileData?: unknown }>(
  data: T
) => ({
  ...data,
  paidWatermarkFileData: data.paidWatermarkFileData ? fromBase64(data.paidWatermarkFileData as string) : null,
  watermarkFileData: data.watermarkFileData ? fromBase64(data.watermarkFileData as string) : null
});

export const encodeStyleProfile = (
  data?: (StyleProfileRow & EntityWithCounts) | null
): StyleProfileWeb | null | undefined => {
  if (!data) return data;
  const bufWatermarPaid = data.paidWatermarkFileData as Buffer | null;
  const bufWatermark = data.watermarkFileData as Buffer | null;
  return {
    ...data,
    fieldSortOrders:
      typeof data.fieldSortOrders === 'string'
        ? (JSON.parse(data.fieldSortOrders) as StyleProfileWeb['fieldSortOrders'])
        : data.fieldSortOrders,
    pdfTexts:
      typeof data.pdfTexts === 'string' ? (JSON.parse(data.pdfTexts) as StyleProfileWeb['pdfTexts']) : data.pdfTexts,
    paidWatermarkFileData: bufWatermarPaid ? bufWatermarPaid.toString('base64') : null,
    watermarkFileData: bufWatermark ? bufWatermark.toString('base64') : null
  };
};

export const encodeResultStyleProfile = (
  result: Response<(StyleProfileRow & EntityWithCounts)[] | (StyleProfileRow & EntityWithCounts)>
): Response<StyleProfileWeb[] | StyleProfileWeb> => ({
  ...result,
  data: Array.isArray(result.data)
    ? result.data.map(item => encodeStyleProfile(item) as StyleProfileWeb)
    : result.data
      ? (encodeStyleProfile(result.data) as StyleProfileWeb)
      : undefined
});

export const decodeInvoiceAttachment = <T extends { data?: unknown }>(attachment: T) => ({
  ...attachment,
  data: attachment.data ? fromBase64(attachment.data as string) : null
});

export const decodeInvoiceAttachments = <T extends { data?: unknown }>(attachments?: T[] | null) => {
  if (!attachments) return attachments;
  return attachments.map(decodeInvoiceAttachment);
};

export const encodeInvoiceAttachment = <T extends { data?: unknown }>(attachment?: T | null) => {
  if (!attachment) return attachment;
  const buf = attachment.data as Buffer | null;
  return {
    ...attachment,
    data: buf ? buf.toString('base64') : null
  };
};

export const encodeInvoiceAttachments = <T extends { data?: unknown }>(attachments?: T[] | null) => {
  if (!attachments) return attachments;
  return attachments.map(encodeInvoiceAttachment);
};

export const decodeInvoice = <T extends Record<string, unknown>>(invoice: T) => ({
  ...invoice,
  signatureData: invoice.signatureData ? fromBase64(invoice.signatureData) : null,
  invoiceCustomization: decodeInvoiceCustomizationImport(invoice?.invoiceCustomization as InvoiceCustomizationRow),
  invoiceAttachments: decodeInvoiceAttachments(invoice.invoiceAttachments as { data?: unknown }[] | null | undefined),
  invoiceBusinessSnapshot: decodeInvoiceBusinessSnapshotImport(
    invoice?.invoiceBusinessSnapshot as InvoiceBusinessSnapshots
  ),
  invoiceBankSnapshot: decodeInvoiceBankSnapshotImport(invoice?.invoiceBankSnapshot as InvoiceBankSnapshots)
});

export const decodeInvoiceBankSnapshotImport = (invoiceB: InvoiceBankSnapshots) => ({
  ...invoiceB,
  qrCode: invoiceB?.qrCode ? fromBase64(invoiceB.qrCode) : null
});

export const decodeInvoiceBusinessSnapshotImport = (invoiceBS: InvoiceBusinessSnapshots) => ({
  ...invoiceBS,
  businessLogo: invoiceBS.businessLogo ? fromBase64(invoiceBS.businessLogo) : null
});

export const decodeInvoiceCustomizationImport = (invoiceC: InvoiceCustomizationRow) => ({
  ...invoiceC,
  paidWatermarkFileData: invoiceC.paidWatermarkFileData ? fromBase64(invoiceC.paidWatermarkFileData) : null,
  watermarkFileData: invoiceC.watermarkFileData ? fromBase64(invoiceC.watermarkFileData) : null
});

export const decodeInvoiceImport = (invoice: InvoiceRow) => ({
  ...invoice,
  signatureData: invoice.signatureData ? fromBase64(invoice.signatureData) : null
});

export const encodeInvoice = <T extends Record<string, unknown>>(invoice?: T | null) => {
  if (!invoice) return invoice;
  return {
    ...invoice,
    signatureData: invoice.signatureData ? (invoice.signatureData as Buffer).toString('base64') : null,
    invoiceCustomization: encodeInvoiceCustomizationExport(invoice?.invoiceCustomization as InvoiceCustomizationRow),
    invoiceBusinessSnapshot: encodeInvoiceBusinessSnapshotExport(
      invoice?.invoiceBusinessSnapshot as InvoiceBusinessSnapshots
    ),
    invoiceBankSnapshot: encodeInvoiceBankSnapshotExport(invoice?.invoiceBankSnapshot as InvoiceBankSnapshots),
    invoiceAttachments: encodeInvoiceAttachments(invoice.invoiceAttachments as { data?: unknown }[] | null | undefined)
  };
};

export const encodeInvoiceBusinessSnapshotExport = (invoiceBS?: InvoiceBusinessSnapshots | null) => {
  if (!invoiceBS) return invoiceBS;
  return {
    ...invoiceBS,
    businessLogo: invoiceBS.businessLogo ? (invoiceBS.businessLogo as Buffer).toString('base64') : null
  };
};

export const encodeInvoiceBankSnapshotExport = (invoiceB?: InvoiceBankSnapshots | null) => {
  if (!invoiceB) return invoiceB;
  return {
    ...invoiceB,
    qrCode: invoiceB.qrCode ? (invoiceB.qrCode as Buffer).toString('base64') : null
  };
};

export const encodeInvoiceCustomizationExport = (invoiceC?: InvoiceCustomizationRow | null) => {
  if (!invoiceC) return invoiceC;
  return {
    ...invoiceC,
    paidWatermarkFileData: invoiceC.paidWatermarkFileData
      ? (invoiceC.paidWatermarkFileData as Buffer).toString('base64')
      : null,
    watermarkFileData: invoiceC.watermarkFileData ? (invoiceC.watermarkFileData as Buffer).toString('base64') : null
  };
};

export const encodeInvoiceExport = (invoice?: InvoiceRow | null) => {
  if (!invoice) return invoice;
  return {
    ...invoice,
    signatureData: invoice.signatureData ? (invoice.signatureData as Buffer).toString('base64') : null
  };
};

export const encodeResultInvoices = <T extends Record<string, unknown>>(result: Response<T[] | T>) => ({
  ...result,
  data: Array.isArray(result.data) ? result.data.map(encodeInvoice) : encodeInvoice(result.data)
});

export const decodeResultInvoices = <T extends Record<string, unknown>>(result: Response<T[] | T>) => ({
  ...result,
  data: Array.isArray(result.data)
    ? result.data.map(decodeInvoice)
    : result.data
      ? decodeInvoice(result.data)
      : undefined
});
