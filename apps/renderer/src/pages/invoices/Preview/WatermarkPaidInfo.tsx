import type { InvoiceFromData } from '../../../shared/types/formData';
import { Image } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { PDF_STYLES } from './constant';

interface Props {
  invoiceForm?: InvoiceFromData;
  watermarkPaidUrl?: string;
}
const WatermarkPaidInfoComponent: FC<Props> = ({ watermarkPaidUrl, invoiceForm }) => {
  if (!watermarkPaidUrl) return null;
  if (!invoiceForm?.invoiceCustomization?.paidWatermarkFileData) return null;

  return <Image src={watermarkPaidUrl} style={PDF_STYLES.watermarkPaid} />;
};
export const WatermarkPaidInfo = memo(WatermarkPaidInfoComponent);
