import { InvoiceScheduleStatus } from '../enums/invoiceSchedule';
import type { Invoice } from '../types/invoice';

export const getInvoiceLabel = (invoice?: Invoice) => {
  if (!invoice) return '';
  const number = invoice.invoiceFullNumber ?? invoice.invoiceNumber;
  const client = invoice.invoiceClientSnapshot?.clientName;
  return client ? `${number} - ${client}` : number;
};

export const getStatusColor = (status: InvoiceScheduleStatus) => {
  if (status === InvoiceScheduleStatus.active) return 'success';
  if (status === InvoiceScheduleStatus.paused) return 'warning';
  if (status === InvoiceScheduleStatus.failed) return 'error';
  if (status === InvoiceScheduleStatus.completed) return 'info';
  return 'default';
};

export const getCadenceUnit = (cadence: string, count: number, t: (key: string) => string) => {
  const plural = count !== 1 ? 'Plural' : 'Singular';
  return t(`invoiceSchedules.units.${cadence}${plural}`);
};

export const getCadenceSummary = (
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
