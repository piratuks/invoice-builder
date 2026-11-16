import type { InvoiceAdd } from '@invoice-builder/contracts';
import { Image } from '@react-pdf/renderer';
import { memo, type FC } from 'react';

interface Props {
  invoiceForm?: InvoiceAdd;
  qrCodeUrl?: string;
}
const QRCodeInfoComponent: FC<Props> = ({ invoiceForm, qrCodeUrl }) => {
  if (!qrCodeUrl) return null;
  if (!invoiceForm?.invoiceBankSnapshot?.qrCode) return null;

  return <Image style={[{ width: 64, height: 64 }]} src={qrCodeUrl} />;
};
export const QRCodeInfo = memo(QRCodeInfoComponent);
