import { useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { InvoiceType } from '../../shared/enums/invoiceType';
import { ReportDateType } from '../../shared/enums/reportDateType';
import { useInvoicesRetrieve } from '../../shared/hooks/invoices/useInvoicesRetrieve';
import type { Invoice } from '../../shared/types/invoice';
import type { Response } from '../../shared/types/response';
import { aggregateInvoicesByCurrency } from '../../shared/utils/invoiceFunctions';
import { useAppDispatch } from '../../state/configureStore';
import { addToast } from '../../state/pageSlice';
import { Header } from './Header';
import { Overview } from './Overview';

export const ReportsPage: FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [reportDateType, setReportDateType] = useState<ReportDateType>(ReportDateType.issuedAt);
  const [dates, setDates] = useState<{ from: string; to: string }>({
    from: new Date().toISOString(),
    to: new Date().toISOString()
  });
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('');

  const { invoices } = useInvoicesRetrieve({
    type: InvoiceType.invoice,
    onDone: (data: Response<Invoice[]>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  const handleCurrencyChange = useCallback((data: string) => {
    setSelectedCurrencyCode(data);
  }, []);

  const handleOnDateTypeChange = useCallback((value: ReportDateType) => {
    setReportDateType(value);
  }, []);

  const handleOnDateChange = useCallback((data: { from: string; to: string }) => {
    setDates({
      from: data.from,
      to: data.to
    });
  }, []);

  const groupedMeta = useMemo(() => {
    if (!invoices) return { groups: {}, invoices: [] };
    return { groups: aggregateInvoicesByCurrency(invoices, dates.from, dates.to, reportDateType), invoices: invoices };
  }, [invoices, dates, reportDateType]);

  return (
    <>
      <Header
        onCurrencyChange={handleCurrencyChange}
        onDateChange={handleOnDateChange}
        onDateTypeChange={handleOnDateTypeChange}
        currencies={groupedMeta.groups}
      />
      <Overview
        reportDateType={reportDateType}
        groupedMeta={groupedMeta}
        dates={dates}
        currencyCode={selectedCurrencyCode}
      />
    </>
  );
};
