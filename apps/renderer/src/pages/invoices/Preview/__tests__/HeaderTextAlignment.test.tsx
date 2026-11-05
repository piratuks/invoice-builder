import type { Settings } from '@invoice-builder/contracts';
import { DateFormat, InvoiceType, SizeType } from '@invoice-builder/contracts';
import { render, screen } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { InvoiceFromData } from '../../../../shared/types/formData';
import type { PdfTexts } from '../../../../shared/types/invoice';
import { HeaderInfo } from '../HeaderInfo';

vi.mock('@react-pdf/renderer', () => {
  type Props = {
    children?: ReactNode;
    style?: CSSProperties | Array<CSSProperties | undefined>;
  };

  const flattenStyle = (style: Props['style']): CSSProperties =>
    Object.assign({}, ...(Array.isArray(style) ? style : [style]));

  return {
    StyleSheet: { create: (styles: Record<string, unknown>) => styles },
    Text: ({ children, style }: Props) => <span style={flattenStyle(style)}>{children}</span>,
    View: ({ children, style }: Props) => <div style={flattenStyle(style)}>{children}</div>,
    Image: () => null
  };
});

const settings = { dateFormat: DateFormat.MMddyyyy } as Settings;

const pdfTexts = {
  invoiceNo: 'Invoice no.',
  quoteNo: 'Quote no.',
  date: 'Date',
  dueDate: 'Due date',
  pdfINVOICE: 'Invoice',
  pdfQUOTE: 'Quotation'
} as PdfTexts;

const alignmentCases = [
  { textAlign: 'left', justifyContent: 'flex-start' },
  { textAlign: 'center', justifyContent: 'center' },
  { textAlign: 'right', justifyContent: 'flex-end' },
  { textAlign: undefined, justifyContent: 'flex-end' }
] as const;

describe.each([SizeType.small, SizeType.medium, SizeType.large])('header alignment with %s font', fontSize => {
  it.each(alignmentCases)(
    'applies textAlign=$textAlign to business information and metadata',
    ({ textAlign, justifyContent }) => {
      const invoiceForm = {
        invoiceType: InvoiceType.invoice,
        invoicePrefix: 'INV-',
        invoiceNumber: '1042',
        issuedAt: '2026-01-15',
        dueDate: '2026-02-15',
        invoiceBusinessSnapshot: {
          businessName: 'Example Company',
          businessAddress: '12 Example Street'
        },
        invoiceCustomization: { fontSize }
      } as InvoiceFromData;

      render(
        <HeaderInfo
          invoiceForm={invoiceForm}
          storeSettings={settings}
          pdfTexts={pdfTexts}
          blocks={[
            { type: 'businessInfo', textAlign },
            {
              type: 'invoiceMeta',
              textAlign,
              showTitle: true,
              showInvoiceLabel: true
            }
          ]}
        />
      );

      const business = screen.getByText('Example Company').parentElement!;

      expect(business).toHaveStyle({
        alignItems: textAlign ? 'stretch' : 'flex-start'
      });
      expect(business.style.textAlign).toBe(textAlign ?? '');
      expect(business.style.width).toBe(textAlign ? '100%' : '');
      expect(screen.getByText('12 Example Street').parentElement).toBe(business);

      const metadata = screen.getByText('Invoice').parentElement!;

      expect(metadata).toHaveStyle({
        alignItems: textAlign ? 'stretch' : 'flex-end'
      });
      expect(metadata.style.textAlign).toBe(textAlign ?? '');
      expect(screen.getByText('Invoice no.:')).toBeInTheDocument();

      for (const content of ['INV-1042', '01/15/2026', '02/15/2026']) {
        const value = screen.getByText(content);
        const row = value.parentElement!;

        expect(value).toHaveStyle({ textAlign: textAlign ?? 'right' });
        expect(row).toHaveStyle({ justifyContent, width: '100%' });
        expect(row.style.flexWrap).toBe(fontSize === SizeType.small ? '' : 'wrap');
      }
    }
  );
});
