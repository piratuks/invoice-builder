import DeleteIcon from '@mui/icons-material/Delete';
import { Alert, Box, CardActions, Chip, Divider, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetInvoicesQuery } from '../../shared/api/invoicesApi';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import { DateFormat } from '../../shared/enums/dateFormat';
import { InvoiceType } from '../../shared/enums/invoiceType';
import type { InvoiceSchedule } from '../../shared/types/invoiceSchedule';
import { formatDate } from '../../shared/utils/formatFunctions';
import { getCadenceSummary, getInvoiceLabel, getStatusColor } from '../../shared/utils/invoiceScheduleFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

interface Props {
  item: InvoiceSchedule;
  selectedItem?: InvoiceSchedule;
  onEdit?: (item: InvoiceSchedule) => void;
  onDelete?: (id: number) => void;
}

export const List: FC<Props> = ({ item, selectedItem, onEdit = () => {}, onDelete = () => {} }) => {
  const { t } = useTranslation();
  const settings = useAppSelector(selectSettings);
  const { data: invoices = [] } = useGetInvoicesQuery({ invoiceType: InvoiceType.invoice });
  const invoice = useMemo(
    () => invoices.find(inv => inv.id === item.sourceInvoiceId),
    [invoices, item.sourceInvoiceId]
  );
  const formatScheduleDate = (value?: string) =>
    value ? formatDate(value, settings?.dateFormat ?? DateFormat.MMddyyyy) : '-';

  return (
    <GenericList
      item={item as InvoiceSchedule & { id: number }}
      selectedItem={selectedItem as (InvoiceSchedule & { id: number }) | undefined}
      showDeleteButton={false}
      paperSx={{
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid',
        borderLeft: '3px solid',
        borderColor: selectedItem?.id === item.id ? 'primary.main' : 'divider',
        overflow: 'hidden'
      }}
      renderContent={() => (
        <Stack spacing={1.25} onClick={() => onEdit(item)} sx={{ p: 2, cursor: 'pointer' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" noWrap sx={{ fontWeight: 600 }}>
                {getInvoiceLabel(invoice) || `${t('common.invoice')} #${item.sourceInvoiceId}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getCadenceSummary(item.cadence, item.intervalCount, t)}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={item.isArchived ? 'default' : getStatusColor(item.status)}
              label={item.isArchived ? t('common.archived') : t(`invoiceSchedules.status.${item.status}`)}
            />
          </Stack>
          <Divider />
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {t('invoiceSchedules.nextRun')}
              </Typography>
              <Typography variant="body2">{formatScheduleDate(item.nextRunAt)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {t('invoiceSchedules.lastRun')}
              </Typography>
              <Typography variant="body2">{formatScheduleDate(item.lastRunAt)}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                {t('invoiceSchedules.deliveryMethod')}
              </Typography>
              <Typography variant="body2">{t(`invoiceSchedules.deliveryValue.${item.deliveryMethod}`)}</Typography>
            </Grid>
          </Grid>
          {item.failureReason && <Alert severity="error">{item.failureReason}</Alert>}
          <CardActions onClick={event => event.stopPropagation()} sx={{ justifyContent: 'flex-end', px: 0, pb: 0 }}>
            <Tooltip title={t('ariaLabel.delete')}>
              <IconButton
                size="small"
                color="error"
                aria-label={t('ariaLabel.delete')}
                onClick={() => onDelete(item.id!)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Stack>
      )}
    />
  );
};
