import type { InvoiceFromData } from '../../../shared/types/formData';
import { Text, View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';

interface PropsLabels {
  customerNoteLabel: string;
  termsConditionsLabel: string;
}
interface Props {
  invoiceForm?: InvoiceFromData;
  labels: PropsLabels;
}
const NotesInfoComponent: FC<Props> = ({ invoiceForm, labels }) => {
  const { customerNoteLabel, termsConditionsLabel } = labels;

  return (
    <View style={[PDF_STYLES.pt20]}>
      {invoiceForm?.thanksNotes && (
        <View
          style={[
            PDF_STYLES.regular,
            PDF_STYLES.italic,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
          ]}
        >
          <Text>{invoiceForm?.thanksNotes}</Text>
        </View>
      )}
      {invoiceForm?.customerNotes && (
        <View style={[PDF_STYLES.pt10]}>
          <View
            style={[
              PDF_STYLES.regularBold,
              { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
            ]}
          >
            <Text>{customerNoteLabel}</Text>
          </View>
          <View
            style={[
              PDF_STYLES.regular,
              { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
            ]}
          >
            <Text>{invoiceForm?.customerNotes}</Text>
          </View>
        </View>
      )}
      {invoiceForm?.termsConditionNotes && (
        <View style={[PDF_STYLES.pt10]}>
          <View
            style={[
              PDF_STYLES.regularBold,
              { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
            ]}
          >
            <Text>{termsConditionsLabel}</Text>
          </View>
          <View
            style={[
              PDF_STYLES.regular,
              { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
            ]}
          >
            <Text>{invoiceForm?.termsConditionNotes}</Text>
          </View>
        </View>
      )}
    </View>
  );
};
export const NotesInfo = memo(NotesInfoComponent);
