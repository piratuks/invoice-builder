import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
        {runs.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 680 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('invoiceSchedules.dueAt')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('common.invoiceNumber')}</TableCell>
                  <TableCell>{t('invoiceSchedules.deliveryStatus')}</TableCell>
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
                    <TableCell sx={{ maxWidth: 240, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {run.errorMessage ?? run.deliveryError ?? '-'}
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
