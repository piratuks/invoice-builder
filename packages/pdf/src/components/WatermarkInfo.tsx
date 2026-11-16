import type { InvoiceAdd } from '@invoice-builder/contracts';
import { Image } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { PDF_STYLES } from './constant.js';

interface Props {
  watermarkUrl?: string;
  invoiceForm?: InvoiceAdd;
}
const WatermarkInfoComponent: FC<Props> = ({ watermarkUrl, invoiceForm }) => {
  if (!watermarkUrl) return null;
  if (!invoiceForm?.invoiceCustomization?.watermarkFileData) return null;

  return <Image src={watermarkUrl} fixed style={PDF_STYLES.watermark} />;
};
export const WatermarkInfo = memo(WatermarkInfoComponent);
