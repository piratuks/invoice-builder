import type { InvoiceFromData } from '../../../shared/types/formData';
import { Text } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { InvoiceType } from '@invoice-builder/contracts';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';

interface PropsLabels {
  pdfQUOTELabel: string;
  pdfINVOICELabel: string;
}
interface Props {
  invoiceForm?: InvoiceFromData;
  labels: PropsLabels;
}
const TitleInfoComponent: FC<Props> = ({ invoiceForm, labels }) => {
  const { pdfINVOICELabel, pdfQUOTELabel } = labels;

  return (
    <Text
      style={[
        PDF_STYLES.title,
        {
          color: invoiceForm?.invoiceCustomization?.color,
          fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].title
        }
      ]}
    >
      {invoiceForm?.invoiceType === InvoiceType.invoice ? pdfINVOICELabel : pdfQUOTELabel}
    </Text>
  );
};
export const TitleInfo = memo(TitleInfoComponent);
