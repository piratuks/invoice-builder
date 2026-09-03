import { Text, View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import type { InvoiceFromData } from '../../../shared/types/invoice';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';

interface Props {
  invoiceForm?: InvoiceFromData;
}
const BusinessInfoComponent: FC<Props> = ({ invoiceForm }) => {
  return (
    <View style={[PDF_STYLES.gap4, PDF_STYLES.alignStart]}>
      <Text
        style={[
          PDF_STYLES.business,
          { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].business }
        ]}
      >
        {invoiceForm?.invoiceBusinessSnapshot?.businessName}
      </Text>
      {invoiceForm?.invoiceBusinessSnapshot?.businessRole && (
        <Text
          style={[
            PDF_STYLES.businessText,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
          ]}
        >
          {invoiceForm?.invoiceBusinessSnapshot?.businessRole}
        </Text>
      )}
      {invoiceForm?.invoiceBusinessSnapshot?.businessAddress && (
        <Text
          style={[
            PDF_STYLES.businessText,
            {
              fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText
            }
          ]}
        >
          {invoiceForm?.invoiceBusinessSnapshot?.businessAddress}
        </Text>
      )}
      {invoiceForm?.invoiceBusinessSnapshot?.businessEmail && (
        <Text
          style={[
            PDF_STYLES.businessText,
            {
              fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText
            }
          ]}
        >
          {invoiceForm?.invoiceBusinessSnapshot?.businessEmail}
        </Text>
      )}
      {invoiceForm?.invoiceBusinessSnapshot?.businessPhone && (
        <Text
          style={[
            PDF_STYLES.businessText,
            {
              fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText
            }
          ]}
        >
          {invoiceForm?.invoiceBusinessSnapshot?.businessPhone}
        </Text>
      )}
      {invoiceForm?.invoiceBusinessSnapshot?.businessCode && (
        <Text
          style={[
            PDF_STYLES.businessText,
            {
              fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText
            }
          ]}
        >
          {invoiceForm?.invoiceBusinessSnapshot?.businessCode}
        </Text>
      )}
      {invoiceForm?.invoiceBusinessSnapshot?.businessVatCode && (
        <Text
          style={[
            PDF_STYLES.businessText,
            {
              fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText
            }
          ]}
        >
          {invoiceForm?.invoiceBusinessSnapshot?.businessVatCode}
        </Text>
      )}
      {invoiceForm?.invoiceBusinessSnapshot?.businessAdditional && (
        <Text
          style={[
            PDF_STYLES.businessText,
            {
              fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText
            }
          ]}
        >
          {invoiceForm?.invoiceBusinessSnapshot?.businessAdditional}
        </Text>
      )}
    </View>
  );
};
export const BusinessInfo = memo(BusinessInfoComponent);
