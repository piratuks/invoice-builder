import type { InvoiceFromData } from '../../../shared/types/formData';
import { Text } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';

interface PropsLabels {
  ofLabel: string;
  pageLabel: string;
}
interface Props {
  invoiceForm?: InvoiceFromData;
  labels: PropsLabels;
}
const PageCounterInfoComponent: FC<Props> = ({ invoiceForm, labels }) => {
  const { ofLabel, pageLabel } = labels;

  return (
    <Text
      fixed
      style={[
        PDF_STYLES.pageCounter,
        { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].pageCounter }
      ]}
      render={({ pageNumber, totalPages }) =>
        totalPages > 1 ? `${pageLabel} ${pageNumber} ${ofLabel} ${totalPages}` : ''
      }
    />
  );
};
export const PageCounterInfo = memo(PageCounterInfoComponent);
