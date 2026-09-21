import { PDFViewer } from '@react-pdf/renderer';
import { memo, useEffect, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAttachmentsUrl,
  getLogoUrl,
  getQRCodeUrls,
  getSignatureUrls,
  getWatermarkPaidUrl,
  getWatermarkUrl
} from '../../../shared/hooks/fileExport/useExportPdf';
import { usePdfTexts } from '../../../shared/hooks/pdf/usePdfTexts';
import type { AttachmentURL, InvoiceFromData } from '../../../shared/types/invoice';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';
import { PDFDocument } from './PDFDocument';

interface Props {
  invoiceForm?: InvoiceFromData;
}
const PreviewCoreComponent: FC<Props> = ({ invoiceForm }) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [watermarkUrl, setWatermarkUrl] = useState<string | undefined>();
  const [watermarkPaidUrl, setWatermarkPaidUrl] = useState<string | undefined>();
  const [attachmentUrls, setAttachmentUrls] = useState<AttachmentURL[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>();
  // Only gates the very first render; later updates keep the current preview visible until new assets resolve.
  const [isReady, setIsReady] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    // Assets are only swapped in once resolved, so the current preview stays visible instead of flashing blank.
    const loadData = async () => {
      const [logo, watermark, watermarkPaid, attachments, signature, qrCode] = await Promise.all([
        getLogoUrl(invoiceForm),
        getWatermarkUrl(invoiceForm),
        getWatermarkPaidUrl(invoiceForm),
        getAttachmentsUrl(invoiceForm),
        getSignatureUrls(invoiceForm),
        getQRCodeUrls(invoiceForm)
      ]);

      if (!cancelled) {
        setLogoUrl(logo);
        setWatermarkUrl(watermark);
        setWatermarkPaidUrl(watermarkPaid);
        setAttachmentUrls(attachments);
        setSignatureUrl(signature);
        setQrCodeUrl(qrCode);
        setIsReady(true);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [invoiceForm]);

  if (!isReady) return null;

  return (
    // No key here: keeping the same instance lets @react-pdf update the existing preview instead of remounting it.
    <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} showToolbar={false}>
      <PDFDocument
        invoiceForm={invoiceForm}
        storeSettings={storeSettings}
        logoUrl={logoUrl}
        qrCodeUrl={qrCodeUrl}
        attachmentUrls={attachmentUrls}
        pdfTexts={pdfTexts}
        layoutRequired={t('common.layoutRequired')}
        watermarkUrl={watermarkUrl}
        watermarkPaidUrl={watermarkPaidUrl}
        signatureUrl={signatureUrl}
      />
    </PDFViewer>
  );
};
export const PreviewCore = memo(PreviewCoreComponent);
