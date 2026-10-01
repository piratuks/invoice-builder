import type { InvoiceFromData } from '../../../shared/types/formData';
import { Image } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import { DEFAULT_LOGO_SIZES, LOGO_SIZES } from './constant';

interface Props {
  invoiceForm?: InvoiceFromData;
  logoUrl?: string;
}
const LogoInfoComponent: FC<Props> = ({ invoiceForm, logoUrl }) => {
  if (!logoUrl) return null;
  if (!invoiceForm?.invoiceBusinessSnapshot?.businessLogo) return null;

  return (
    <Image
      style={[{ ...LOGO_SIZES[invoiceForm?.invoiceCustomization?.logoSize ?? DEFAULT_LOGO_SIZES] }]}
      src={logoUrl}
    />
  );
};
export const LogoInfo = memo(LogoInfoComponent);
