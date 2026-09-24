import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetInvoiceScheduleRunsQuery } from '../../shared/api/invoiceSchedulesApi';
import { useGetInvoicesQuery } from '../../shared/api/invoicesApi';
import { DateFormat } from '../../shared/enums/dateFormat';
import { InvoiceType } from '../../shared/enums/invoiceType';
import type { InvoiceSchedule } from '../../shared/types/invoiceSchedule';
import { formatDate } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

interface Props {
  schedule?: InvoiceSchedule;
  onClose: () => void;
}

export const ScheduleRunHistoryDialog: FC<Props> = ({ schedule, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const settings = useAppSelector(selectSettings);
  const { data: runs = [], isFetching } = useGetInvoiceScheduleRunsQuery(schedule?.id ?? -1, {
    skip: !schedule?.id
  });
  const { data: invoices = [] } = useGetInvoicesQuery({ invoiceType: InvoiceType.invoice });
  const formatScheduleDate = (value?: string) =>
    value ? formatDate(value, settings?.dateFormat ?? DateFormat.MMddyyyy) : '-';
  const invoiceNumberById = new Map(
    invoices.map(invoice => [invoice.id, invoice.invoiceFullNumber ?? invoice.invoiceNumber])
  );

  return (
    <Dialog open={Boolean(schedule)} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="md">
      <DialogTitle>{t('invoiceSchedules.runHistory')}</DialogTitle>
      <DialogContent>
        {isFetching && <Typography>{t('common.checking')}</Typography>}
        {!isFetching && runs.length === 0 && <Alert severity="info">{t('invoiceSchedules.noRuns')}</Alert>}
        {runs.length > 0 && !isDesktop && (
          <Stack spacing={2}>
            {runs.map(run => (
              <Box key={run.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack spacing={1}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('invoiceSchedules.dueAt')}
                    </Typography>
                    <Typography variant="body2">{formatScheduleDate(run.dueAt)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('common.status')}
                    </Typography>
                    <Typography variant="body2">{t(`invoiceSchedules.runStatus.${run.status}`)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('common.invoiceNumber')}
                    </Typography>
                    <Typography variant="body2">
                      {run.generatedInvoiceId ? (invoiceNumberById.get(run.generatedInvoiceId) ?? '-') : '-'}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {t('invoiceSchedules.deliveryStatus')}
                    </Typography>
                    <Typography variant="body2">
                      {t(`invoiceSchedules.deliveryStatusValue.${run.deliveryStatus}`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('invoiceSchedules.deliveryRecipient')}
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {run.deliveryRecipient ?? '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('invoiceSchedules.deliveryAttemptedAt')}
                    </Typography>
                    <Typography variant="body2">{formatScheduleDate(run.deliveryAttemptedAt)}</Typography>
                  </Stack>
                  {(run.errorMessage || run.deliveryError || run.deliveryAttemptError) && (
                    <Alert severity="error">{run.errorMessage ?? run.deliveryError ?? run.deliveryAttemptError}</Alert>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
        {runs.length > 0 && isDesktop && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('invoiceSchedules.dueAt')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('common.invoiceNumber')}</TableCell>
                  <TableCell>{t('invoiceSchedules.deliveryStatus')}</TableCell>
                  <TableCell>{t('invoiceSchedules.deliveryRecipient')}</TableCell>
                  <TableCell>{t('invoiceSchedules.deliveryAttemptedAt')}</TableCell>
                  <TableCell>{t('invoiceSchedules.error')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.map(run => (
                  <TableRow key={run.id}>
                    <TableCell>{formatScheduleDate(run.dueAt)}</TableCell>
                    <TableCell>{t(`invoiceSchedules.runStatus.${run.status}`)}</TableCell>
                    <TableCell>
                      {run.generatedInvoiceId ? (invoiceNumberById.get(run.generatedInvoiceId) ?? '-') : '-'}
                    </TableCell>
                    <TableCell>{t(`invoiceSchedules.deliveryStatusValue.${run.deliveryStatus}`)}</TableCell>
                    <TableCell>{run.deliveryRecipient ?? '-'}</TableCell>
                    <TableCell>{formatScheduleDate(run.deliveryAttemptedAt)}</TableCell>
                    <TableCell sx={{ maxWidth: 240, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {run.errorMessage ?? run.deliveryError ?? run.deliveryAttemptError ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};
