import { Text, View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import type { InvoiceFromData } from '../../../shared/types/invoice';
import type { PaymentSource } from '../../../shared/types/layouts';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';
import { QRCodeInfo } from './QRCodeInfo';

interface Props {
  qrCodeUrl?: string;
  invoiceForm?: InvoiceFromData;
  paymentInfoLabel: string;
  source?: PaymentSource;
}
const PaymentInfoComponent: FC<Props> = ({ invoiceForm, qrCodeUrl, paymentInfoLabel, source = 'bank' }) => {
  if (source === 'legacyBusiness') {
    const paymentInformation = invoiceForm?.invoiceBusinessSnapshot?.businessPaymentInformation;
    if (!paymentInformation) return null;

    return (
      <View style={[PDF_STYLES.alignStart, PDF_STYLES.gap4]}>
        <Text
          style={[
            PDF_STYLES.regularBold,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
          ]}
        >
          {paymentInfoLabel}:
        </Text>
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {paymentInformation}
        </Text>
      </View>
    );
  }

  if (!invoiceForm?.invoiceBankSnapshot) return null;

  return (
    <View style={[PDF_STYLES.alignStart, PDF_STYLES.gap4]}>
      <Text
        style={[
          PDF_STYLES.regularBold,
          { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
        ]}
      >
        {paymentInfoLabel}:
      </Text>
      <View style={[PDF_STYLES.alignStart, PDF_STYLES.gap4, PDF_STYLES.row]}>
        <View style={[PDF_STYLES.alignStart, PDF_STYLES.gap4]}>
          {invoiceForm?.invoiceBankSnapshot?.accountHolder && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.accountHolder}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.bankName && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.bankName}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.sortOrder && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.sortOrder}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.accountNumber && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.accountNumber}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.swiftCode && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.swiftCode}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.routingNumber && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.routingNumber}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.branchCode && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.branchCode}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.address && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.address}
            </Text>
          )}
          {invoiceForm?.invoiceBankSnapshot?.upiCode && (
            <Text
              style={[
                PDF_STYLES.businessText,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
              ]}
            >
              {invoiceForm?.invoiceBankSnapshot?.upiCode}
            </Text>
          )}
        </View>
        <QRCodeInfo qrCodeUrl={qrCodeUrl} invoiceForm={invoiceForm} />
      </View>
    </View>
  );
};
export const PaymentInfo = memo(PaymentInfoComponent);
