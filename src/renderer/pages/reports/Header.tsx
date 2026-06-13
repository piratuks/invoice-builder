import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useTheme,
  type SelectChangeEvent
} from '@mui/material';
import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears
} from 'date-fns';
import { memo, useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportDateType } from '../../shared/enums/reportDateType';
import { ReportRangeType } from '../../shared/enums/reportRangeType';
import type { InvoicesByCurrency } from '../../shared/types/invoice';
import { toUTCISOString } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';
import { RangeSetter } from './Modals/RangeSetter';

interface Props {
  currencies: InvoicesByCurrency;
  onDateChange?: (value: { from: string; to: string }) => void;
  onCurrencyChange?: (value: string) => void;
  onDateTypeChange?: (value: ReportDateType) => void;
}

const HeaderComponent: FC<Props> = ({
  onDateTypeChange = () => {},
  onCurrencyChange = () => {},
  onDateChange = () => {},
  currencies
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);

  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('');
  const [dates, setDates] = useState<{ from: string; to: string }>({
    from: new Date().toISOString(),
    to: new Date().toISOString()
  });
  const [internalValue, setInternalValue] = useState<ReportRangeType>(ReportRangeType.last_30_days);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [reportDateType, setReportDateType] = useState<ReportDateType>(ReportDateType.issuedAt);

  const handleDateTypeChange = (event: SelectChangeEvent<ReportDateType>) => {
    const newValue = event.target.value;
    setReportDateType(newValue);
  };

  const handleChange = (event: SelectChangeEvent<ReportRangeType>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSave = useCallback(
    (data: { from: string; to: string }) => {
      handleClose();
      setDates({
        from: data.from,
        to: data.to
      });
    },
    [handleClose]
  );

  const handleCurrencyChange = useCallback((event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedCurrencyCode(value);
  }, []);

  const getRangeForPreset = useCallback((preset: ReportRangeType): { from: Date; to: Date } => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    switch (preset) {
      case ReportRangeType.last_30_days:
        return {
          from: startOfDay(subDays(todayStart, 29)),
          to: todayEnd
        };

      case ReportRangeType.this_month:
        return {
          from: startOfMonth(todayStart),
          to: endOfMonth(todayStart)
        };

      case ReportRangeType.last_month: {
        const lastMonthDate = subMonths(todayStart, 1);
        return {
          from: startOfMonth(lastMonthDate),
          to: endOfMonth(lastMonthDate)
        };
      }

      case ReportRangeType.this_quarter:
        return {
          from: startOfQuarter(todayStart),
          to: endOfQuarter(todayStart)
        };

      case ReportRangeType.last_quarter: {
        const lastQuarterDate = subQuarters(todayStart, 1);
        return {
          from: startOfQuarter(lastQuarterDate),
          to: endOfQuarter(lastQuarterDate)
        };
      }

      case ReportRangeType.this_year:
        return {
          from: startOfYear(todayStart),
          to: endOfYear(todayStart)
        };

      case ReportRangeType.last_year: {
        const lastYearDate = subYears(todayStart, 1);
        return {
          from: startOfYear(lastYearDate),
          to: endOfYear(lastYearDate)
        };
      }

      case ReportRangeType.custom:
        return { from: todayStart, to: todayEnd };
      default:
        return { from: todayStart, to: todayEnd };
    }
  }, []);

  useEffect(() => {
    onDateTypeChange(reportDateType);
  }, [onDateTypeChange, reportDateType]);

  useEffect(() => {
    onCurrencyChange(selectedCurrencyCode);
  }, [onCurrencyChange, selectedCurrencyCode]);

  useEffect(() => {
    const entries = Object.keys(currencies);
    if (entries.length > 0) {
      setSelectedCurrencyCode(entries[0]);
    } else {
      setSelectedCurrencyCode('');
    }
  }, [currencies]);

  useEffect(() => {
    const range = getRangeForPreset(internalValue);
    const fromUTC = toUTCISOString(range.from);
    const toUTC = toUTCISOString(range.to);

    setDates({
      from: fromUTC,
      to: toUTC
    });
  }, [internalValue, getRangeForPreset]);

  useEffect(() => {
    onDateChange(dates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates]);

  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="h5" noWrap component="div" sx={{ color: theme.palette.secondary.main }}>
          {t('reports.title')}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="date-label">{t('common.currency')}</InputLabel>
          <Select
            labelId="date-label"
            label={t('common.currency')}
            value={reportDateType}
            onChange={handleDateTypeChange}
          >
            <MenuItem value={ReportDateType.issuedAt}>{t('reports.dateTypeIssuedAt')}</MenuItem>
            <MenuItem value={ReportDateType.paidAt}>{t('reports.dateTypePaidAt')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="currency-label">{t('common.currency')}</InputLabel>
          <Select
            labelId="currency-label"
            label={t('common.currency')}
            value={selectedCurrencyCode}
            onChange={handleCurrencyChange}
          >
            {Object.entries(currencies).map(([code]) => (
              <MenuItem key={code} value={code}>
                {currencies[code].currencyCode}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="date-range-label">{t('reports.dateRange')}</InputLabel>
          <Select
            labelId="date-range-label"
            label={t('reports.dateRange')}
            value={internalValue}
            onChange={handleChange}
          >
            <MenuItem value={ReportRangeType.last_30_days}>{t('reports.last30Days')}</MenuItem>
            <MenuItem value={ReportRangeType.this_month}>{t('reports.thisMonth')}</MenuItem>
            <MenuItem value={ReportRangeType.last_month}>{t('reports.lastMonth')}</MenuItem>
            <MenuItem value={ReportRangeType.this_quarter}>{t('reports.thisQuarter')}</MenuItem>
            <MenuItem value={ReportRangeType.last_quarter}>{t('reports.lastQuarter')}</MenuItem>
            <MenuItem value={ReportRangeType.this_year}>{t('reports.thisYear')}</MenuItem>
            <MenuItem value={ReportRangeType.last_year}>{t('reports.lastYear')}</MenuItem>
            <MenuItem value={ReportRangeType.custom} onClick={() => setIsOpen(true)}>
              {t('reports.customRange')}
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
      {storeSettings && (
        <RangeSetter
          key={dates.from + dates.to}
          to={dates.to}
          fromDate={dates.from}
          isOpen={isOpen}
          onCancel={handleClose}
          onSave={handleSave}
        />
      )}
    </>
  );
};
export const Header = memo(HeaderComponent);
