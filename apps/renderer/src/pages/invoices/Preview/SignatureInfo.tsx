import type { InvoiceFromData } from '../../../shared/types/formData';
import { Image, Text, View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';

interface Props {
  invoiceForm?: InvoiceFromData;
  signatureUrl?: string;
  authorisedSignatoryLabel: string;
}
const SignatureInfoComponent: FC<Props> = ({ invoiceForm, signatureUrl, authorisedSignatoryLabel }) => {
  if (!signatureUrl) return null;
  if (!invoiceForm?.signatureData) return null;

  return (
    <View
      wrap={false}
      style={[PDF_STYLES.textEnd, PDF_STYLES.alignEnd, PDF_STYLES.pb20, PDF_STYLES.w100]}
      minPresenceAhead={40}
    >
      <Image src={signatureUrl} style={PDF_STYLES.signature} />
      <Text
        style={[
          PDF_STYLES.businessText,
          { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].businessText }
        ]}
      >
        {authorisedSignatoryLabel}
      </Text>
    </View>
  );
};
export const SignatureInfo = memo(SignatureInfoComponent);
