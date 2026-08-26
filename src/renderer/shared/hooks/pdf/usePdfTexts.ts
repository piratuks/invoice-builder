import { useMemo } from 'react';
import type { Language } from '../../enums/language';
import type { PdfTexts } from '../../types/invoice';
import { useUppercaseTranslation } from './useUppercaseTranslation';

export const usePdfTexts = (
  data: { labelUpperCase?: boolean; language?: Language } | undefined = undefined
): PdfTexts => {
  const { tt } = useUppercaseTranslation(data?.labelUpperCase, data?.language);

  return useMemo(() => {
    return {
      billTo: tt('invoices.billTo'),
      invoiceNo: tt('common.invoiceNo'),
      quoteNo: tt('common.quoteNo'),
      date: tt('common.date'),
      dueDate: tt('common.dueDate'),
      customerNote: tt('invoices.customerNote'),
      termsConditions: tt('invoices.termsConditions'),
      of: tt('common.of'),
      page: tt('common.page'),
      paymentInfo: tt('common.paymentInfo'),
      pdfINVOICE: tt('invoices.pdfINVOICE'),
      pdfQUOTE: tt('invoices.pdfQUOTE'),
      subTotalLabel: tt('invoices.subTotal'),
      discountLabel: tt('invoices.discount'),
      surchargeLabel: tt('invoices.surcharge'),
      incLabel: tt('invoices.inc'),
      taxLabel: tt('invoices.taxLabel'),
      taxExclusivePerItemLabel: tt('invoices.taxExclusivePerItem'),
      taxInclusivePerItemLabel: tt('invoices.taxInclusivePerItem'),
      shippingFeeLabel: tt('invoices.shippingFee'),
      paidLabel: tt('invoices.paid'),
      balanceDueLabel: tt('invoices.balanceDue'),
      itemLabel: tt('common.item'),
      unitLabel: tt('common.unit'),
      qtyLabel: tt('common.qty'),
      unitCostLabel: tt('common.unitCost'),
      totalLabel: tt('common.total'),
      authorisedSignatoryLabel: tt('common.authorisedSignatory')
    };
  }, [tt]);
};
