import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  Alert,
  Box,
  Button,
  CardActions,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateInvoiceScheduleMutation } from '../../shared/api/invoiceSchedulesApi';
import { useGetInvoicesQuery } from '../../shared/api/invoicesApi';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import { DateFormat } from '../../shared/enums/dateFormat';
import { InvoiceScheduleStatus } from '../../shared/enums/invoiceSchedule';
import { InvoiceType } from '../../shared/enums/invoiceType';
import type { Invoice } from '../../shared/types/invoice';
import type { InvoiceSchedule } from '../../shared/types/invoiceSchedule';
import { formatDate } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';
import { ScheduleRunHistoryDialog } from './ScheduleRunHistoryDialog';

const getInvoiceLabel = (invoice?: Invoice) => {
  if (!invoice) return '';
  const number = invoice.invoiceFullNumber ?? invoice.invoiceNumber;
  const client = invoice.invoiceClientSnapshot?.clientName;
  return client ? `${number} - ${client}` : number;
};

const getStatusColor = (status: InvoiceScheduleStatus) => {
  if (status === InvoiceScheduleStatus.active) return 'success';
  if (status === InvoiceScheduleStatus.paused) return 'warning';
  if (status === InvoiceScheduleStatus.failed) return 'error';
  if (status === InvoiceScheduleStatus.completed) return 'info';
  return 'default';
};

const getCadenceUnit = (cadence: string, count: number, t: (key: string) => string) => {
  const plural = count !== 1 ? 'Plural' : 'Singular';
  return t(`invoiceSchedules.units.${cadence}${plural}`);
};

const getCadenceSummary = (
  cadence: string,
  count: number,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  if (count === 1) return t(`invoiceSchedules.repeats.${cadence}`);

  return t('invoiceSchedules.everyInterval', {
    count,
    unit: getCadenceUnit(cadence, count, t)
  });
};

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
  const [updateSchedule] = useUpdateInvoiceScheduleMutation();
  const [historySchedule, setHistorySchedule] = useState<InvoiceSchedule | undefined>();
  const invoice = useMemo(
    () => invoices.find(inv => inv.id === item.sourceInvoiceId),
    [invoices, item.sourceInvoiceId]
  );
  const formatScheduleDate = (value?: string) =>
    value ? formatDate(value, settings?.dateFormat ?? DateFormat.MMddyyyy) : '-';

  const setScheduleStatus = async (status: InvoiceScheduleStatus) => {
    await updateSchedule({ id: item.id!, status }).unwrap();
  };

  return (
    <>
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
                color={getStatusColor(item.status)}
                label={t(`invoiceSchedules.status.${item.status}`)}
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
            <CardActions
              onClick={event => event.stopPropagation()}
              sx={{ justifyContent: 'space-between', px: 0, pb: 0 }}
            >
              <Button size="small" startIcon={<HistoryIcon />} onClick={() => setHistorySchedule(item)}>
                {t('invoiceSchedules.history')}
              </Button>
              <Stack direction="row" sx={{ gap: 0.5 }}>
                {item.status === InvoiceScheduleStatus.active ? (
                  <Tooltip title={t('invoiceSchedules.pause')}>
                    <IconButton
                      size="small"
                      aria-label={t('invoiceSchedules.pause')}
                      onClick={() => setScheduleStatus(InvoiceScheduleStatus.paused)}
                    >
                      <PauseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title={t('invoiceSchedules.resume')}>
                    <span>
                      <IconButton
                        size="small"
                        aria-label={t('invoiceSchedules.resume')}
                        disabled={item.status === InvoiceScheduleStatus.completed}
                        onClick={() => setScheduleStatus(InvoiceScheduleStatus.active)}
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
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
              </Stack>
            </CardActions>
          </Stack>
        )}
      />
      <ScheduleRunHistoryDialog schedule={historySchedule} onClose={() => setHistorySchedule(undefined)} />
    </>
  );
};
