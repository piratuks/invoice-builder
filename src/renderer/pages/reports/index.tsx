import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useGetInvoicesQuery } from '../../shared/api/invoicesApi';
import { InvoiceType } from '../../shared/enums/invoiceType';
import { ReportDateType } from '../../shared/enums/reportDateType';
import { aggregateInvoicesByCurrency } from '../../shared/utils/invoiceFunctions';
import { useAppDispatch } from '../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor } from '../../state/pageSlice';
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

  const {
    data: invoices = [],
    isLoading,
    isFetching,
    isError,
    error
  } = useGetInvoicesQuery({ invoiceType: InvoiceType.invoice });

  useEffect(() => {
    if (!isError) return;
    const { message, key } = (error as { message?: string; key?: string }) ?? {};
    if (message) {
      dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
    } else if (key) {
      dispatch(addToast({ message: t(key), severity: 'error' }));
    }
  }, [dispatch, error, isError, t]);

  useEffect(() => {
    if (!isLoading && !isFetching) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isFetching, isLoading]);

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
