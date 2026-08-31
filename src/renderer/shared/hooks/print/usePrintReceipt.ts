import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../../state/configureStore';
import { addToast } from '../../../state/pageSlice';
import type { InvoiceFromData } from '../../types/invoice';
import type { Settings } from '../../types/settings';
import { buildReceiptHtml } from '../../utils/receiptFunctions';
import { usePdfTexts } from '../pdf/usePdfTexts';

export const usePrintReceipt = (data: { invoiceForm?: InvoiceFromData; storeSettings?: Settings }) => {
  const { invoiceForm, storeSettings } = data;
  const dispatch = useAppDispatch();
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

  const printReceipt = useCallback(async () => {
    if (!invoiceForm || !storeSettings || !window.electronAPI?.printReceipt) return;

    try {
      const html = buildReceiptHtml({
        invoiceForm,
        storeSettings,
        texts: {
          invoiceLabel: pdfTexts.invoiceNo,
          quoteLabel: pdfTexts.quoteNo,
          issuedAtLabel: pdfTexts.date,
          billToLabel: pdfTexts.billTo,
          itemLabel: pdfTexts.itemLabel,
          qtyLabel: pdfTexts.qtyLabel,
          unitCostLabel: pdfTexts.unitCostLabel,
          subTotalLabel: pdfTexts.subTotalLabel,
          discountLabel: pdfTexts.discountLabel,
          surchargeLabel: pdfTexts.surchargeLabel,
          incLabel: pdfTexts.incLabel,
          taxLabel: pdfTexts.taxLabel,
          taxExclusivePerItemLabel: pdfTexts.taxExclusivePerItemLabel,
          taxInclusivePerItemLabel: pdfTexts.taxInclusivePerItemLabel,
          shippingFeeLabel: pdfTexts.shippingFeeLabel,
          totalLabel: pdfTexts.totalLabel,
          paidLabel: pdfTexts.paidLabel,
          balanceDueLabel: pdfTexts.balanceDueLabel
        }
      });

      const result = await window.electronAPI.printReceipt(html);

      if (!result.success) {
        const message = result.message;
        if (message) dispatch(addToast({ message, severity: 'error' }));
        else if (result.key) dispatch(addToast({ message: t(result.key), severity: 'error' }));
        else dispatch(addToast({ message: t('error.printFailed'), severity: 'error' }));
      }
    } catch (error) {
      dispatch(
        addToast({ message: error instanceof Error ? error.message : t('error.printFailed'), severity: 'error' })
      );
    }
  }, [invoiceForm, storeSettings, dispatch, t, pdfTexts]);

  return { printReceipt };
};
