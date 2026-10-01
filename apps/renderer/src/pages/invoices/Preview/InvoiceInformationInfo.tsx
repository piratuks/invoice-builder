import type { Settings } from '@invoice-builder/contracts';
import { InvoiceType, SizeType } from '@invoice-builder/contracts';
import { Text, View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import type { InvoiceFromData } from '../../../shared/types/formData';

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
  const fontSize = invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES;
  const invoiceMetaRowStyle =
    fontSize === SizeType.large || fontSize === SizeType.medium
      ? PDF_STYLES.invoiceMetaRowWrap
      : PDF_STYLES.invoiceMetaRow;

  return (
    <View style={[PDF_STYLES.invoiceMeta, PDF_STYLES.alignEnd, PDF_STYLES.gap4]}>
      {showTitle && (
        <TitleInfo
          invoiceForm={invoiceForm}
          labels={{
            pdfINVOICELabel: pdfINVOICELabel,
            pdfQUOTELabel: pdfQUOTELabel
          }}
        />
      )}

      <View style={[PDF_STYLES.invoiceMeta, PDF_STYLES.gap3, PDF_STYLES.alignEnd]}>
        <View style={invoiceMetaRowStyle}>
          {showInvoiceLabel && (
            <Text style={[PDF_STYLES.regularBold, { fontSize: FONT_SIZES[fontSize].regularBold }]}>
              {invoiceForm?.invoiceType === InvoiceType.invoice ? invoiceNoLabel : quoteNoLabel}:{' '}
            </Text>
          )}
          <Text style={[PDF_STYLES.regular, PDF_STYLES.invoiceMetaValue, { fontSize: FONT_SIZES[fontSize].regular }]}>
            {invoiceForm?.invoicePrefix}
            {invoiceForm?.invoiceNumber}
            {invoiceForm?.invoiceSuffix}
          </Text>
        </View>
        {storeSettings && invoiceForm?.issuedAt && (
          <View style={invoiceMetaRowStyle}>
            <Text style={[PDF_STYLES.regularBold, { fontSize: FONT_SIZES[fontSize].regularBold }]}>{dateLabel}: </Text>
            <Text style={[PDF_STYLES.regular, PDF_STYLES.invoiceMetaValue, { fontSize: FONT_SIZES[fontSize].regular }]}>
              {formatDate(invoiceForm.issuedAt, storeSettings.dateFormat)}
            </Text>
          </View>
        )}
        {storeSettings && invoiceForm?.dueDate && (
          <View style={invoiceMetaRowStyle}>
            <Text style={[PDF_STYLES.regularBold, { fontSize: FONT_SIZES[fontSize].regularBold }]}>
              {dueDateLabel}:{' '}
            </Text>
            <Text style={[PDF_STYLES.regular, PDF_STYLES.invoiceMetaValue, { fontSize: FONT_SIZES[fontSize].regular }]}>
              {formatDate(invoiceForm.dueDate, storeSettings.dateFormat)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
export const InvoiceInformationInfo = memo(InvoiceInformationInfoComponent);
