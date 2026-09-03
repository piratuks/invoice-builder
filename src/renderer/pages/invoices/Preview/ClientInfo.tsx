import { Text, View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import type { InvoiceFromData } from '../../../shared/types/invoice';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';

interface Props {
  invoiceForm?: InvoiceFromData;
  billToLabel: string;
}
const ClientInfoComponent: FC<Props> = ({ invoiceForm, billToLabel }) => {
  return (
    <View style={[PDF_STYLES.alignStart, PDF_STYLES.gap4]}>
      <Text
        style={[
          PDF_STYLES.regularBold,
          { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
        ]}
      >
        {billToLabel}:
      </Text>
      <Text
        style={[
          PDF_STYLES.businessText,
          { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
        ]}
      >
        {invoiceForm?.invoiceClientSnapshot?.clientName}
      </Text>
      {invoiceForm?.invoiceClientSnapshot?.clientAddress && (
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {invoiceForm?.invoiceClientSnapshot?.clientAddress}
        </Text>
      )}
      {invoiceForm?.invoiceClientSnapshot?.clientEmail && (
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {invoiceForm?.invoiceClientSnapshot?.clientEmail}
        </Text>
      )}
      {invoiceForm?.invoiceClientSnapshot?.clientPhone && (
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {invoiceForm?.invoiceClientSnapshot?.clientPhone}
        </Text>
      )}
      {invoiceForm?.invoiceClientSnapshot?.clientCode && (
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {invoiceForm?.invoiceClientSnapshot?.clientCode}
        </Text>
      )}
      {invoiceForm?.invoiceClientSnapshot?.clientVatCode && (
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {invoiceForm?.invoiceClientSnapshot?.clientVatCode}
        </Text>
      )}
      {invoiceForm?.invoiceClientSnapshot?.clientAdditional && (
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {invoiceForm?.invoiceClientSnapshot?.clientAdditional}
        </Text>
      )}
    </View>
  );
};
export const ClientInfo = memo(ClientInfoComponent);
