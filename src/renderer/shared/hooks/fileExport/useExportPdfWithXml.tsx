import { PDFDocument as PdfLibDocument } from 'pdf-lib';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { InvoiceFromData } from '../../types/invoice';
import type { Settings } from '../../types/settings';
import { usePdfTexts } from '../pdf/usePdfTexts';
import { createPdfBlob, getPDFFilename } from './useExportPdf';

export const useExportPdfWithXml = (data: { invoiceForm?: InvoiceFromData; storeSettings?: Settings }) => {
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

  const exportPdfWithXml = useCallback(
    async (xml: Uint8Array) => {
      if (!invoiceForm || !storeSettings) return;

      const blob = await createPdfBlob(invoiceForm, storeSettings, pdfTexts, t('common.layoutRequired'));

      const pdfBytes = new Uint8Array(await blob.arrayBuffer());

      const pdfDoc = await PdfLibDocument.load(pdfBytes);
      pdfDoc.attach(xml, `ubl-invoice`, { mimeType: 'application/xml' });
      const modifiedPdfBytes = await pdfDoc.save();

      const newBlob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });

      const url = URL.createObjectURL(newBlob);
      const a = document.createElement('a');

      a.href = url;
      a.download = getPDFFilename(invoiceForm, storeSettings);
      a.click();
      URL.revokeObjectURL(url);
    },
    [invoiceForm, storeSettings, pdfTexts, t]
  );

  return { exportPdfWithXml };
};
