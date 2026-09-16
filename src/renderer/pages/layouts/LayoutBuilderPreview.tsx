import { Box } from '@mui/material';
import { PDFViewer } from '@react-pdf/renderer';
import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrencyFormat } from '../../shared/enums/currencyFormat';
import { DiscountType } from '../../shared/enums/discountType';
import { FontFamily } from '../../shared/enums/fontFamily';
import { InvoiceStatus } from '../../shared/enums/invoiceStatus';
import { InvoiceType } from '../../shared/enums/invoiceType';
import { Language } from '../../shared/enums/language';
import { PageFormat } from '../../shared/enums/pageFormat';
import { SizeType } from '../../shared/enums/sizeType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../../shared/enums/taxType';
import { usePdfTexts } from '../../shared/hooks/pdf/usePdfTexts';
import type { InvoiceFromData } from '../../shared/types/invoice';
import type { LayoutSchemaAny } from '../../shared/types/layouts';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';
import { PDFDocument } from '../invoices/Preview/PDFDocument';

const previewInvoice = (layoutSchema: LayoutSchemaAny): InvoiceFromData => ({
  invoiceType: InvoiceType.invoice,
  status: InvoiceStatus.unpaid,
  layoutId: 1,
  invoiceNumber: 'PREVIEW-1001',
  issuedAt: '2026-09-15',
  dueDate: '2026-10-15',
  currencyFormat: CurrencyFormat.amountSpaceSymbol,
  language: Language.en,
  customerNotes: 'Thank you for your business.',
  thanksNotes: 'We appreciate your continued partnership.',
  termsConditionNotes: 'Payment due within 30 days.',
  discountType: DiscountType.fixed,
  discountAmountCents: '1000',
  discountPercent: 0,
  shippingFeeCents: '1500',
  surchargeType: DiscountType.percentage,
  surchargeAmountCents: '0',
  surchargePercent: 2,
  taxName: 'VAT',
  taxRate: 21,
  taxType: InvoiceTaxType.exclusive,
  invoiceItems: [
    {
      itemId: 1,
      quantity: '2',
      taxRate: 21,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItemSnapshot: {
        parentInvoiceItemId: 1,
        itemName: 'Design services',
        unitPriceCents: '12500',
        unitName: 'hour'
      }
    },
    {
      itemId: 2,
      quantity: '1',
      taxRate: 21,
      taxType: InvoiceItemTaxType.exclusive,
      invoiceItemSnapshot: {
        parentInvoiceItemId: 2,
        itemName: 'Project setup',
        unitPriceCents: '8500',
        unitName: 'item'
      }
    }
  ],
  invoiceCurrencySnapshot: { currencyCode: 'EUR', currencySymbol: '€', currencySubunit: 2 },
  invoiceBusinessSnapshot: {
    businessName: 'Northstar Studio',
    businessShortName: 'NS',
    businessAddress: '18 Harbor Street, Vilnius, LT-92123',
    businessEmail: 'hello@northstar.example',
    businessPhone: '+370 612 48392',
    businessAdditional: 'Studio and consulting services',
    businessRole: 'Design and consulting studio',
    businessCode: 'LT100012345678',
    businessVatCode: 'LT100012345678',
    businessCountryCode: 'LT'
  },
  invoiceClientSnapshot: {
    clientName: 'BluePeak Staffing UAB',
    clientAddress: '42 Market Avenue, Vilnius, LT-01100',
    clientEmail: 'billing@bluepeak.example',
    clientPhone: '+370 605 27184',
    clientCode: 'BP-2026',
    clientAdditional: 'Accounts payable department',
    clientVatCode: 'LT100009876543',
    clientCountryCode: 'LT'
  },
  invoiceBankSnapshot: {
    name: 'Amberline Commercial Bank',
    bankName: 'Amberline Commercial Bank',
    accountNumber: 'LT12 7300 0101 9876 5432',
    swiftCode: 'AGBLLT2X',
    address: '21A Central Avenue, Vilnius, LT-01100',
    branchCode: '73000',
    accountHolder: 'Northstar Studio',
    type: 'Business account'
  },
  invoicePayments: [],
  invoiceCustomization: {
    pageFormat: PageFormat.a4,
    fontFamily: FontFamily.roboto,
    fontSize: SizeType.small,
    showQuantity: true,
    showUnit: true,
    showRowNo: true,
    fieldSortOrders: { no: 1, item: 2, unit: 3, quantity: 4, unitCost: 5, total: 6 }
  },
  invoiceLayoutSnapshot: { layoutSchema }
});

export const LayoutBuilderPreview: FC<{ schema: LayoutSchemaAny }> = ({ schema }) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);
  const pdfTexts = usePdfTexts({});
  const invoiceForm = useMemo(() => previewInvoice(schema), [schema]);

  return (
    <Box sx={{ height: '100%' }}>
      <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} showToolbar={false}>
        <PDFDocument
          invoiceForm={invoiceForm}
          storeSettings={storeSettings}
          attachmentUrls={[]}
          pdfTexts={pdfTexts}
          layoutRequired={t('common.layoutRequired')}
        />
      </PDFViewer>
    </Box>
  );
};
