import { pdf } from '@react-pdf/renderer';
import { parseISO } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PDFDocument } from '../../../pages/invoices/Preview/PDFDocument';
import { MONTH_NAMES } from '../../../state/constant';
import { InvoiceType } from '../../enums/invoiceType';
import type { AttachmentURL, InvoiceFromData, PdfTexts } from '../../types/invoice';

import type { Settings } from '../../types/settings';
import { toDataUrl } from '../../utils/dataUrlFunctions';
import { usePdfTexts } from '../pdf/usePdfTexts';

export const getAttachmentsUrl = async (invoiceForm?: InvoiceFromData): Promise<AttachmentURL[]> => {
  const attachments = invoiceForm?.invoiceAttachments ?? [];

  if (attachments.length === 0) {
    return [];
  }

  const list = await Promise.all(
    attachments.map(async attachment => {
      const url = attachment.data ? await toDataUrl(attachment.data, attachment.fileType) : undefined;

      return { id: attachment.id as number, url };
    })
  );

  return list;
};

export const getSignatureUrls = async (invoiceForm?: InvoiceFromData) => {
  if (!invoiceForm) return;

  let signatureUrl: string | undefined;

  if (invoiceForm.signatureData) {
    signatureUrl = await toDataUrl(invoiceForm.signatureData, invoiceForm.signatureType);
  }

  return signatureUrl;
};

export const getLogoUrl = async (invoiceForm?: InvoiceFromData) => {
  if (!invoiceForm) return;

  let logoUrl: string | undefined;

  if (invoiceForm.invoiceBusinessSnapshot?.businessLogo) {
    logoUrl = await toDataUrl(
      invoiceForm.invoiceBusinessSnapshot?.businessLogo,
      invoiceForm.invoiceBusinessSnapshot?.businessFileType
    );
  }

  return logoUrl;
};

export const getQRCodeUrls = async (invoiceForm?: InvoiceFromData) => {
  if (!invoiceForm) return;

  let qrCodeUrl: string | undefined;

  if (invoiceForm.invoiceBankSnapshot?.qrCode) {
    qrCodeUrl = await toDataUrl(
      invoiceForm.invoiceBankSnapshot?.qrCode,
      invoiceForm.invoiceBankSnapshot?.qrCodeFileType
    );
  }

  return qrCodeUrl;
};

export const getWatermarkUrl = async (invoiceForm?: InvoiceFromData) => {
  if (!invoiceForm) return;

  let watermarkUrl: string | undefined;

  if (invoiceForm.invoiceCustomization?.watermarkFileData) {
    watermarkUrl = await toDataUrl(
      invoiceForm.invoiceCustomization?.watermarkFileData,
      invoiceForm.invoiceCustomization?.watermarkFileType
    );
  }

  return watermarkUrl;
};

export const getWatermarkPaidUrl = async (invoiceForm?: InvoiceFromData) => {
  if (!invoiceForm) return;

  let watermarkPaidUrl: string | undefined;

  if (invoiceForm.invoiceCustomization?.paidWatermarkFileData) {
    watermarkPaidUrl = await toDataUrl(
      invoiceForm.invoiceCustomization?.paidWatermarkFileData,
      invoiceForm.invoiceCustomization?.paidWatermarkFileType
    );
  }

  return watermarkPaidUrl;
};

export const createPdfBlob = async (
  invoiceForm: InvoiceFromData,
  storeSettings: Settings,
  pdfTexts: PdfTexts,
  layoutRequired: string
) => {
  const logoUrl = await getLogoUrl(invoiceForm);
  const attachmentUrls = await getAttachmentsUrl(invoiceForm);
  const watermarkUrl = await getWatermarkUrl(invoiceForm);
  const watermarkPaidUrl = await getWatermarkPaidUrl(invoiceForm);
  const signatureUrl = await getSignatureUrls(invoiceForm);
  const qrCodeUrl = await getQRCodeUrls(invoiceForm);

  const blob = await pdf(
    <PDFDocument
      invoiceForm={invoiceForm}
      storeSettings={storeSettings}
      logoUrl={logoUrl}
      qrCodeUrl={qrCodeUrl}
      attachmentUrls={attachmentUrls}
      pdfTexts={pdfTexts}
      layoutRequired={layoutRequired}
      watermarkUrl={watermarkUrl}
      watermarkPaidUrl={watermarkPaidUrl}
      signatureUrl={signatureUrl}
    />
  ).toBlob();

  return blob;
};

export const getPDFFilename = (invoiceForm: InvoiceFromData, storeSettings: Settings) => {
  const hasInvoicePart = invoiceForm.invoicePrefix || invoiceForm.invoiceNumber || invoiceForm.invoiceSuffix;
  const subTypeName = invoiceForm.invoiceType === InvoiceType.invoice ? 'Invoice' : 'Quote';
  const invoiceNumber = `${hasInvoicePart ? '_' : ''}${invoiceForm.invoicePrefix ?? ''}${invoiceForm.invoiceNumber ?? ''}${invoiceForm.invoiceSuffix ?? ''}`;
  const issuedAtDate = invoiceForm?.issuedAt ? parseISO(invoiceForm.issuedAt) : undefined;
  const year = issuedAtDate && storeSettings?.shouldIncludeYear ? `_${issuedAtDate.getFullYear()}` : '';
  const month = issuedAtDate && storeSettings?.shouldIncludeMonth ? `_${MONTH_NAMES[issuedAtDate.getMonth()]}` : '';
  const businessName = storeSettings?.shouldIncludeBusinessName
    ? `${invoiceForm?.invoiceBusinessSnapshot?.businessName ? invoiceForm?.invoiceBusinessSnapshot?.businessName.trim().replaceAll(' ', '_') + '_' : ''}`
    : '';

  return `${businessName}${subTypeName}${invoiceNumber}${year}${month}.pdf`;
};

export const useExportPdf = (data: { invoiceForm?: InvoiceFromData; storeSettings?: Settings }) => {
  const { invoiceForm, storeSettings } = data;
  const { t } = useTranslation();

  const pdfTextsDefaults = usePdfTexts({
    labelUpperCase: invoiceForm?.invoiceCustomization?.labelUpperCase,
    language: invoiceForm?.language
  });
  const pdfTexts = useMemo(() => {
    const customLabels = invoiceForm?.invoiceCustomization?.pdfTexts || {};

    return {
      ...pdfTextsDefaults,
      ...customLabels
    };
  }, [invoiceForm, pdfTextsDefaults]);

  const exportPdf = useCallback(async () => {
    if (!invoiceForm || !storeSettings) return;

    const blob = await createPdfBlob(invoiceForm, storeSettings, pdfTexts, t('common.layoutRequired'));

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = getPDFFilename(invoiceForm, storeSettings);
    a.click();

    URL.revokeObjectURL(url);
  }, [invoiceForm, storeSettings, pdfTexts, t]);

  return { exportPdf };
};
