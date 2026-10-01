import type { InvoiceFromData } from '../../../shared/types/formData';
import { Box, ListItemButton, ListItemText, Typography } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceType } from '@invoice-builder/contracts';
import { formatDate } from '../../../shared/utils/formatFunctions';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';

interface Props {
  type: InvoiceType;
  invoiceForm?: InvoiceFromData;
  onEdit: () => void;
}

const InvoiceInformationSelectorComponent: FC<Props> = ({ type, invoiceForm, onEdit }) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);

  return (
    <Box sx={{ width: 'fit-content' }}>
      <ListItemButton
        onClick={onEdit}
        sx={{
          pt: 2,
          pb: 2,
          pl: 2,
          pr: 2,
          width: '100%',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          flexDirection: 'column'
        }}
      >
        <ListItemText
          primary={
            <Typography
              component="div"
              variant="body1"
              sx={{ fontWeight: 600, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {type === InvoiceType.quotation
                ? t('invoices.quoteInfo').toUpperCase()
                : t('invoices.invoiceInfo').toUpperCase()}{' '}
              *
            </Typography>
          }
          secondary={
            <>
              <Typography
                component="div"
                variant="body2"
                sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {invoiceForm?.invoicePrefix}
                {invoiceForm?.invoiceNumber}
                {invoiceForm?.invoiceSuffix}
              </Typography>
              {storeSettings && invoiceForm?.issuedAt && (
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {t('invoices.issuedAt', { date: formatDate(invoiceForm.issuedAt, storeSettings.dateFormat) })}
                </Typography>
              )}
              {storeSettings && invoiceForm?.dueDate && (
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {t('invoices.dueDateAt', { date: formatDate(invoiceForm.dueDate, storeSettings.dateFormat) })}
                </Typography>
              )}
            </>
          }
          disableTypography
          sx={{ m: 0, textAlign: 'end' }}
          slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
        />
      </ListItemButton>
    </Box>
  );
};
export const InvoiceInformationSelector = memo(InvoiceInformationSelectorComponent);
