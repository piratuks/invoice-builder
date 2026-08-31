import { DiscountType } from '../enums/discountType';
import { InvoiceStatus } from '../enums/invoiceStatus';
import { InvoiceType } from '../enums/invoiceType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../enums/taxType';
import type { InvoiceFromData } from '../types/invoice';
import type { Settings } from '../types/settings';
import { formatDate } from './formatFunctions';
import { getFinancialData, getItemFinancialData } from './invoiceFunctions';

const escapeHtml = (value?: string) =>
  (value ?? '').replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });

export interface ReceiptTexts {
  invoiceLabel: string;
  quoteLabel: string;
  issuedAtLabel: string;
  billToLabel: string;
  itemLabel: string;
  qtyLabel: string;
  unitCostLabel: string;
  subTotalLabel: string;
  discountLabel: string;
  surchargeLabel: string;
  incLabel: string;
  taxLabel: string;
  taxExclusivePerItemLabel: string;
  taxInclusivePerItemLabel: string;
  shippingFeeLabel: string;
  totalLabel: string;
  paidLabel: string;
  balanceDueLabel: string;
}

// 80mm thermal paper is ~302px at 96dpi (3.15in), used as the print viewport width.
const RECEIPT_WIDTH_PX = 302;

export const buildReceiptHtml = (data: {
  invoiceForm: InvoiceFromData;
  storeSettings: Settings;
  texts: ReceiptTexts;
}) => {
  const { invoiceForm, storeSettings, texts } = data;

  const {
    formattedTotalTaxAmount,
    formattedSubTotalAmount,
    totalAmountFormatted,
    discountAmountFormatted,
    shippingAmountFormatted,
    surchargeAmountFormatted,
    totalAmountPaidFormatted,
    balanceDueFormatted,
    shippingAmount,
    surchargeAmount,
    discountAmount,
    totalTax,
    totalAmountPaid
  } = getFinancialData({
    storeSettings,
    currencySymbol: invoiceForm.invoiceCurrencySnapshot?.currencySymbol,
    currencyCode: invoiceForm.invoiceCurrencySnapshot?.currencyCode,
    currencySubunit: invoiceForm.invoiceCurrencySnapshot?.currencySubunit ?? 0,
    currencyFormat: invoiceForm.currencyFormat,
    invoiceItems: invoiceForm.invoiceItems ?? [],
    discountType: invoiceForm.discountType,
    discountAmount: Number(invoiceForm.discountAmountCents ?? 0),
    discountPercent: invoiceForm.discountPercent,
    taxRate: invoiceForm.taxRate ?? 0,
    shippingAmount: Number(invoiceForm.shippingFeeCents ?? 0),
    surchargeType: invoiceForm.surchargeType,
    surchargeAmount: Number(invoiceForm.surchargeAmountCents ?? 0),
    surchargePercent: invoiceForm.surchargePercent,
    taxType: invoiceForm.taxType,
    invoicePayments: invoiceForm.invoicePayments ?? []
  });

  const invoiceItems = invoiceForm.invoiceItems ?? [];

  const itemsHtml = invoiceItems
    .map(item => {
      const unitPriceCents = Number(item.invoiceItemSnapshot.unitPriceCents);
      const quantity = Number(item.quantity);

      const { formattedUnitPrice, formattedTotal } = getItemFinancialData({
        storeSettings,
        currencySymbol: invoiceForm.invoiceCurrencySnapshot?.currencySymbol,
        currencyCode: invoiceForm.invoiceCurrencySnapshot?.currencyCode,
        currencySubunit: invoiceForm.invoiceCurrencySnapshot?.currencySubunit ?? 0,
        currencyFormat: invoiceForm.currencyFormat,
        unitPrice: unitPriceCents,
        quantity,
        taxType: item.taxType,
        taxRate: item.taxRate,
        invoiceItems,
        discountType: invoiceForm.discountType,
        discountAmount: Number(invoiceForm.discountAmountCents ?? 0),
        discountPercent: invoiceForm.discountPercent
      });

      return `
        <div class="item">
          <div class="item-name">${escapeHtml(item.invoiceItemSnapshot.itemName)}</div>
          <div class="item-line">
            <span>${escapeHtml(quantity.toString())} x ${escapeHtml(formattedUnitPrice)}</span>
            <span>${escapeHtml(formattedTotal)}</span>
          </div>
        </div>`;
    })
    .join('');

  const totalsRow = (label: string, amount: string) => `
    <div class="totals-row">
      <span>${escapeHtml(label)}</span>
      <span>${escapeHtml(amount)}</span>
    </div>`;

  const hasPerItemTaxExclusive = invoiceForm.invoiceItems?.some(item => item.taxType === InvoiceItemTaxType.exclusive);
  const hasPerItemTaxInclusive = invoiceForm.invoiceItems?.some(item => item.taxType === InvoiceItemTaxType.inclusive);

  const taxRowLabel = (() => {
    if (invoiceForm.taxType === InvoiceTaxType.deducted || invoiceForm.taxType === InvoiceTaxType.exclusive) {
      return invoiceForm.taxName
        ? `${invoiceForm.taxName} (${invoiceForm.taxRate}%)`
        : `${texts.taxLabel} (${invoiceForm.taxRate ?? 0}%)`;
    }

    if (invoiceForm.taxType === InvoiceTaxType.inclusive) {
      return invoiceForm.taxName
        ? `${invoiceForm.taxName} (${texts.incLabel} ${invoiceForm.taxRate}%)`
        : `${texts.taxLabel} (${texts.incLabel} ${invoiceForm.taxRate}%)`;
    }

    if (hasPerItemTaxExclusive) return texts.taxExclusivePerItemLabel;
    if (hasPerItemTaxInclusive) return texts.taxInclusivePerItemLabel;
    if (!invoiceForm.taxType) return `${texts.taxLabel} (${invoiceForm.taxRate ?? 0}%)`;

    return texts.taxLabel;
  })();

  const optionalTotalsHtml = [
    discountAmount > 0
      ? totalsRow(
          invoiceForm.discountType === DiscountType.percentage
            ? `${texts.discountLabel} (${invoiceForm.discountPercent ?? 0}%)`
            : texts.discountLabel,
          `-${discountAmountFormatted}`
        )
      : '',
    Math.abs(totalTax) > 0 ? totalsRow(taxRowLabel, formattedTotalTaxAmount) : '',
    shippingAmount > 0 ? totalsRow(texts.shippingFeeLabel, shippingAmountFormatted) : '',
    surchargeAmount > 0
      ? totalsRow(
          invoiceForm.surchargeType === DiscountType.percentage
            ? `${texts.surchargeLabel} (${invoiceForm.surchargePercent ?? 0}%)`
            : texts.surchargeLabel,
          `-${surchargeAmountFormatted}`
        )
      : ''
  ].join('');

  const businessName = invoiceForm.invoiceBusinessSnapshot?.businessName;
  const businessAddress = invoiceForm.invoiceBusinessSnapshot?.businessAddress;
  const businessPhone = invoiceForm.invoiceBusinessSnapshot?.businessPhone;
  const businessEmail = invoiceForm.invoiceBusinessSnapshot?.businessEmail;

  const clientName = invoiceForm.invoiceClientSnapshot?.clientName;
  const clientAddress = invoiceForm.invoiceClientSnapshot?.clientAddress;

  const invoiceFullNumber = `${invoiceForm.invoicePrefix ?? ''}${invoiceForm.invoiceNumber ?? ''}${invoiceForm.invoiceSuffix ?? ''}`;
  const issuedAt = invoiceForm.issuedAt ? formatDate(invoiceForm.issuedAt, storeSettings.dateFormat) : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(businessName)}</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 4mm;
      }
      * { 
        box-sizing: border-box;
      }
      body {
        width: ${RECEIPT_WIDTH_PX}px;
        margin: 0;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #000;
      }
      .center {
        text-align: center;
      }
      .business-name {
        font-size: 15px;
        font-weight: bold;
      }
      .divider {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }
      .item {
        margin-bottom: 4px;
      }
      .item-name {
        font-weight: bold;
      }
      .item-line,
      .totals-row {
        display: flex;
        justify-content: space-between;
      }
      .totals-row.grand-total {
        font-weight: bold;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="center business-name">${escapeHtml(businessName)}</div>
    ${businessAddress ? `<div class="center">${escapeHtml(businessAddress)}</div>` : ''}
    ${businessPhone ? `<div class="center">${escapeHtml(businessPhone)}</div>` : ''}
    ${businessEmail ? `<div class="center">${escapeHtml(businessEmail)}</div>` : ''}

    <div class="divider"></div>

    <div>${escapeHtml(invoiceForm.invoiceType === InvoiceType.quotation ? texts.quoteLabel : texts.invoiceLabel)} #${escapeHtml(invoiceFullNumber)}</div>
    ${issuedAt ? `<div>${escapeHtml(texts.issuedAtLabel)}: ${escapeHtml(issuedAt)}</div>` : ''}

    ${
      clientName
        ? `<div class="divider"></div>
    <div>${escapeHtml(texts.billToLabel)}:</div>
    <div>${escapeHtml(clientName)}</div>
    ${clientAddress ? `<div>${escapeHtml(clientAddress)}</div>` : ''}`
        : ''
    }

    <div class="divider"></div>

    ${itemsHtml}

    <div class="divider"></div>

    ${
      discountAmount > 0 || Math.abs(totalTax) > 0 || shippingAmount > 0 || surchargeAmount > 0
        ? `${totalsRow(texts.subTotalLabel, formattedSubTotalAmount)}`
        : ''
    }

    ${optionalTotalsHtml}

    ${discountAmount > 0 || Math.abs(totalTax) > 0 || shippingAmount > 0 || surchargeAmount > 0 ? `<div class="divider"></div>` : ''}
 
    ${
      totalAmountPaid > 0 &&
      invoiceForm?.invoiceType === InvoiceType.invoice &&
      invoiceForm?.status !== InvoiceStatus.paid
        ? totalsRow(texts.totalLabel, totalAmountFormatted)
        : ''
    }
    
    ${
      totalAmountPaid > 0 &&
      invoiceForm?.invoiceType === InvoiceType.invoice &&
      invoiceForm?.status !== InvoiceStatus.paid
        ? totalsRow(texts.paidLabel, totalAmountPaidFormatted)
        : ''
    }

    ${
      invoiceForm?.invoiceType === InvoiceType.invoice && invoiceForm?.status !== InvoiceStatus.paid
        ? `<div class="totals-row grand-total">
      <span>${escapeHtml(texts.balanceDueLabel)}</span>
      <span>${escapeHtml(balanceDueFormatted)}</span>
    </div>`
        : ''
    }

  </body>
</html>`;
};
