import { Text, View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import type { InvoiceFromData } from '../../../shared/types/invoice';
import type { Settings } from '../../../shared/types/settings';
import { formatDate } from '../../../shared/utils/formatFunctions';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';
import { TitleInfo } from './TitleInfo';

interface PropsLabels {
  invoiceNoLabel: string;
  quoteNoLabel: string;
  dueDateLabel: string;
  dateLabel: string;
  pdfQUOTELabel: string;
  pdfINVOICELabel: string;
}
interface Props {
  invoiceForm?: InvoiceFromData;
  storeSettings?: Settings;
  labels: PropsLabels;
  showTitle?: boolean;
  showInvoiceLabel?: boolean;
}
const InvoiceInformationInfoComponent: FC<Props> = ({
  invoiceForm,
  storeSettings,
  labels,
  showTitle,
  showInvoiceLabel
}) => {
  const { invoiceNoLabel, quoteNoLabel, dueDateLabel, dateLabel, pdfQUOTELabel, pdfINVOICELabel } = labels;

  return (
    <View style={[PDF_STYLES.alignEnd, PDF_STYLES.gap4]}>
      {showTitle && (
        <TitleInfo
          invoiceForm={invoiceForm}
          labels={{
            pdfINVOICELabel: pdfINVOICELabel,
            pdfQUOTELabel: pdfQUOTELabel
          }}
        />
      )}

      <View style={[PDF_STYLES.gap3, PDF_STYLES.alignEnd, {}]}>
        <View style={[PDF_STYLES.row, PDF_STYLES.alignEnd]}>
          {showInvoiceLabel && (
            <Text
              style={[
                PDF_STYLES.regularBold,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
              ]}
            >
              {invoiceForm?.invoiceType === InvoiceType.invoice ? invoiceNoLabel : quoteNoLabel}:{' '}
            </Text>
          )}
          <Text
            style={[
              PDF_STYLES.regular,
              { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
            ]}
          >
            {invoiceForm?.invoicePrefix}
            {invoiceForm?.invoiceNumber}
            {invoiceForm?.invoiceSuffix}
          </Text>
        </View>
        {storeSettings && invoiceForm?.issuedAt && (
          <View style={[PDF_STYLES.row, PDF_STYLES.alignEnd]}>
            <Text
              style={[
                PDF_STYLES.regularBold,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
              ]}
            >
              {dateLabel}:{' '}
            </Text>
            <Text
              style={[
                PDF_STYLES.regular,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
              ]}
            >
              {formatDate(invoiceForm.issuedAt, storeSettings.dateFormat)}
            </Text>
          </View>
        )}
        {storeSettings && invoiceForm?.dueDate && (
          <View style={[PDF_STYLES.row, PDF_STYLES.alignEnd]}>
            <Text
              style={[
                PDF_STYLES.regularBold,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
              ]}
            >
              {dueDateLabel}:{' '}
            </Text>
            <Text
              style={[
                PDF_STYLES.regular,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
              ]}
            >
              {formatDate(invoiceForm.dueDate, storeSettings.dateFormat)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
export const InvoiceInformationInfo = memo(InvoiceInformationInfoComponent);
