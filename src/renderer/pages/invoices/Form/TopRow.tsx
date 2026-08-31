import { Box } from '@mui/material';
import { memo, useMemo, type FC } from 'react';
import type { InvoiceFromData } from '../../../shared/types/invoice';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';
import { BankSelector } from './BankSelector';
import { CurrencySelector } from './CurrencySelector';
import { LanguageSelector } from './LanguageSelector';
import { StyleProfileSelector } from './StyleProfileSelector';

interface Props {
  invoiceForm?: InvoiceFromData;
  onEditCurrency: () => void;
  onEditLanguage: () => void;
  onEditStyleProfile: () => void;
  onEditBank: () => void;
  onClearBank?: () => void;
}
const TopRowComponent: FC<Props> = ({
  invoiceForm,
  onEditBank,
  onEditCurrency,
  onEditStyleProfile,
  onEditLanguage,
  onClearBank
}) => {
  const storeSettings = useAppSelector(selectSettings);

  const currencyFormData = useMemo(
    () => ({
      currencyCode: invoiceForm?.invoiceCurrencySnapshot?.currencyCode,
      currencySymbol: invoiceForm?.invoiceCurrencySnapshot?.currencySymbol
    }),
    [invoiceForm?.invoiceCurrencySnapshot]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
      <CurrencySelector onEdit={onEditCurrency} data={currencyFormData} />
      <BankSelector onEdit={onEditBank} onClear={onClearBank} name={invoiceForm?.invoiceBankSnapshot?.name} />
      {storeSettings?.styleProfilesON && (
        <StyleProfileSelector
          onEdit={onEditStyleProfile}
          name={invoiceForm?.invoiceStyleProfileSnapshot?.styleProfileName}
        />
      )}
      <LanguageSelector onEdit={onEditLanguage} language={invoiceForm?.language} />
    </Box>
  );
};
export const TopRow = memo(TopRowComponent);
