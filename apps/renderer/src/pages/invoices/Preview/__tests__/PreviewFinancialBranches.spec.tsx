import type { InvoiceFromData } from '../../../../shared/types/formData';
import type { Settings } from '@invoice-builder/contracts';
import {
  AmountFormat,
  DiscountType,
  FontFamily,
  InvoiceItemTaxType,
  InvoiceStatus,
  InvoiceTaxType,
  InvoiceType,
  PaymentType,
  TableHeaderStyle,
  TableRowStyle
} from '@invoice-builder/contracts';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { FinancialInfo } from '../FinancialInfo';
import { ItemsInfo } from '../ItemsInfo';

vi.mock('@react-pdf/renderer', () => ({
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  View: ({ children, style }: { children?: ReactNode; style?: unknown }) => (
    <div data-pdf-style={JSON.stringify(style)}>{children}</div>
  )
}));

const settings = { amountFormat: AmountFormat.enUS } as Settings;

const itemLabels = {
  itemLabel: 'Item',
  unitLabel: 'Unit',
  qtyLabel: 'Quantity',
  unitCostLabel: 'Unit cost',
  totalLabel: 'Total',
  taxLabel: 'Tax',
  discountLabel: 'Discount'
};

const financialLabels = {
  subTotalLabel: 'Subtotal',
  discountLabel: 'Discount',
  surchargeLabel: 'Surcharge',
  incLabel: 'incl.',
  taxLabel: 'Tax',
  taxExclusivePerItemLabel: 'Per-item tax excl.',
  taxInclusivePerItemLabel: 'Per-item tax incl.',
  shippingFeeLabel: 'Shipping',
  totalLabel: 'Total',
  paidLabel: 'Paid',
  balanceDueLabel: 'Balance due'
};

const invoiceItems = [
  {
    itemId: 1,
    quantity: '2',
    taxRate: 20,
    taxType: InvoiceItemTaxType.exclusive,
    customField: { header: 'Project phase', value: 'Discovery', alignment: 'left', sortOrder: 7 },
    invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Consulting', unitPriceCents: '10000', unitName: 'hour' }
  },
  {
    itemId: 2,
    quantity: '1',
    taxRate: 0,
    customField: { header: 'Project phase', value: '', alignment: 'left', sortOrder: 7 },
    invoiceItemSnapshot: { parentInvoiceItemId: 2, itemName: 'Expenses', unitPriceCents: '2500', unitName: 'each' }
  }
] as NonNullable<InvoiceFromData['invoiceItems']>;

const baseInvoice: InvoiceFromData = {
  invoiceType: InvoiceType.invoice,
  status: InvoiceStatus.open,
  invoiceItems,
  invoicePayments: [],
  discountAmountCents: '0',
  shippingFeeCents: '0',
  surchargeAmountCents: '0',
  taxRate: 0,
  invoiceCustomization: {
    color: '#204060',
    fontFamily: FontFamily.roboto,
    showRowNo: true,
    showQuantity: true,
    showUnit: true,
    tableHeaderStyle: TableHeaderStyle.light,
    tableRowStyle: TableRowStyle.bordered,
    fieldSortOrders: { no: 1, item: 2, unit: 3, quantity: 4, unitCost: 5, total: 6, missing: 8 }
  }
};

describe('Preview item and financial branches', () => {
  it('renders fixed columns, custom values, item tax, and distributed discounts', () => {
    render(
      <ItemsInfo
        invoiceForm={{
          ...baseInvoice,
          discountType: DiscountType.percentage,
          discountPercent: 10
        }}
        storeSettings={settings}
        labels={itemLabels}
      />
    );

    for (const heading of ['#', 'Item', 'Unit', 'Quantity', 'Unit cost', 'Total', 'Project phase']) {
      expect(screen.getByText(heading)).toBeInTheDocument();
    }
    expect(screen.getByText('Consulting')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText(/^Discount:/)).toBeInTheDocument();
    expect(screen.getByText(/^Tax\(20%\):/)).toBeInTheDocument();
  });

  it('gives longer custom-field content more flex space than a short item name', () => {
    render(
      <ItemsInfo
        invoiceForm={{
          ...baseInvoice,
          invoiceItems: [
            {
              ...invoiceItems[0],
              customField: {
                ...invoiceItems[0].customField!,
                value: 'Discovery and implementation planning'
              },
              invoiceItemSnapshot: { ...invoiceItems[0].invoiceItemSnapshot, itemName: 'Fee' }
            }
          ]
        }}
        storeSettings={settings}
        labels={itemLabels}
      />
    );

    const itemStyle = JSON.parse(screen.getByText('Item').parentElement?.dataset.pdfStyle ?? '[]');
    const customStyle = JSON.parse(screen.getByText('Project phase').parentElement?.dataset.pdfStyle ?? '[]');

    expect(itemStyle[1].minWidth).toBe(customStyle[1].minWidth);
    expect(customStyle[1].flexGrow).toBeGreaterThan(itemStyle[1].flexGrow * 4);
  });

  it('renders proportional dark and stripped layouts with optional columns hidden', () => {
    const { container, rerender } = render(
      <ItemsInfo
        columnSizing="proportional"
        invoiceForm={{
          ...baseInvoice,
          invoiceCustomization: {
            ...baseInvoice.invoiceCustomization,
            color: undefined,
            fontFamily: undefined,
            showRowNo: false,
            showQuantity: false,
            showUnit: false,
            tableHeaderStyle: TableHeaderStyle.dark,
            tableRowStyle: TableRowStyle.stripped
          } as NonNullable<InvoiceFromData['invoiceCustomization']>
        }}
        storeSettings={settings}
        labels={itemLabels}
      />
    );

    expect(screen.queryByText('#')).not.toBeInTheDocument();
    expect(screen.queryByText('Quantity')).not.toBeInTheDocument();
    expect(screen.queryByText('Unit')).not.toBeInTheDocument();
    expect(screen.getByText('Project phase')).toBeInTheDocument();
    expect(container).toHaveTextContent('Expenses');

    rerender(
      <ItemsInfo
        invoiceForm={{
          ...baseInvoice,
          invoiceCustomization: {
            ...baseInvoice.invoiceCustomization,
            fontFamily: undefined,
            tableHeaderStyle: TableHeaderStyle.outline,
            tableRowStyle: TableRowStyle.bordered
          } as NonNullable<InvoiceFromData['invoiceCustomization']>
        }}
        storeSettings={settings}
        labels={itemLabels}
      />
    );
    expect(screen.getByText('Project phase')).toBeInTheDocument();

    rerender(
      <ItemsInfo
        invoiceForm={{
          ...baseInvoice,
          invoiceCustomization: {
            ...baseInvoice.invoiceCustomization,
            tableHeaderStyle: undefined,
            tableRowStyle: TableRowStyle.classic
          } as NonNullable<InvoiceFromData['invoiceCustomization']>
        }}
        storeSettings={settings}
        labels={itemLabels}
      />
    );
    expect(screen.getByText('Consulting')).toBeInTheDocument();
  });

  it('renders all global adjustments, named exclusive tax, and a partial payment', () => {
    const { container } = render(
      <FinancialInfo
        align="start"
        invoiceForm={{
          ...baseInvoice,
          invoiceItems: [{ ...invoiceItems[1], taxType: undefined }],
          discountType: DiscountType.percentage,
          discountPercent: 10,
          taxType: InvoiceTaxType.exclusive,
          taxName: 'VAT',
          taxRate: 20,
          shippingFeeCents: '500',
          surchargeType: DiscountType.percentage,
          surchargePercent: 5,
          invoicePayments: [{ amountCents: '1000', paidAt: '2026-01-20', paymentMethod: PaymentType.bank }]
        }}
        storeSettings={settings}
        labels={financialLabels}
      />
    );

    expect(container).toHaveTextContent('Discount (10%)');
    expect(container).toHaveTextContent('VAT (20%)');
    expect(container).toHaveTextContent('Shipping');
    expect(container).toHaveTextContent('Surcharge (5%)');
    expect(container).toHaveTextContent('Paid');
    expect(container).toHaveTextContent('Balance due');
  });

  it('renders inclusive and exclusive per-item tax labels for a quotation', () => {
    const { container } = render(
      <FinancialInfo
        align="center"
        invoiceForm={{
          ...baseInvoice,
          invoiceType: InvoiceType.quotation,
          invoiceItems: [invoiceItems[0], { ...invoiceItems[1], taxRate: 10, taxType: InvoiceItemTaxType.inclusive }],
          discountType: DiscountType.fixed,
          discountAmountCents: '100',
          surchargeType: DiscountType.fixed,
          surchargeAmountCents: '200'
        }}
        storeSettings={settings}
        labels={financialLabels}
      />
    );

    expect(container).toHaveTextContent('Per-item tax excl.');
    expect(container).toHaveTextContent('Per-item tax incl.');
    expect(container).toHaveTextContent('Discount');
    expect(container).toHaveTextContent('Surcharge');
    expect(container).toHaveTextContent('Total');
    expect(container).not.toHaveTextContent('Balance due');
  });

  it('renders inclusive unnamed tax and suppresses the balance for paid invoices', () => {
    const { container, rerender } = render(
      <FinancialInfo
        invoiceForm={{
          ...baseInvoice,
          status: InvoiceStatus.paid,
          invoiceItems: [{ ...invoiceItems[1], taxType: undefined }],
          taxType: InvoiceTaxType.inclusive,
          taxRate: 15
        }}
        storeSettings={settings}
        labels={financialLabels}
      />
    );

    expect(container).toHaveTextContent('Tax (incl. 15%)');
    expect(container).toHaveTextContent('Total');
    expect(container).not.toHaveTextContent('Balance due');

    rerender(
      <FinancialInfo
        invoiceForm={{
          ...baseInvoice,
          invoiceItems: [{ ...invoiceItems[1], taxType: undefined }],
          taxType: InvoiceTaxType.deducted,
          taxRate: 5
        }}
        storeSettings={settings}
        labels={financialLabels}
      />
    );
    expect(container).toHaveTextContent('Tax (5%)');
    expect(container).toHaveTextContent('Balance due');
  });
});
