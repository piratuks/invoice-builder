import { Grid, useTheme } from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SummaryCard } from '../../shared/components/layout/summaryCard/SummaryCard';
import { Themes } from '../../shared/enums/themes';
import type { InvoicesByCurrencyMeta } from '../../shared/types/invoice';
import { formatAmount } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

interface Props {
  data: InvoicesByCurrencyMeta;
}
const FinancialCardsComponent: FC<Props> = ({ data }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <SummaryCard
          title={t('common.total')}
          value={formatAmount(data.totalAmount, storeSettings?.amountFormat)}
          subtitle={t('reports.totalInvoices', { count: data.invoiceCount })}
          bgColor={theme.palette.primary.main}
          textColor={theme.palette.mode === Themes.dark ? theme.palette.common.black : theme.palette.common.white}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <SummaryCard
          title={t('reports.collectionRate')}
          value={`${data.collectionRate.toFixed(2)}%`}
          subtitle={t('reports.avgInvoice', {
            avg: formatAmount(data.avgPerInvoice, storeSettings?.amountFormat)
          })}
          bgColor={theme.palette.secondary.main}
          textColor={theme.palette.mode === Themes.dark ? theme.palette.common.black : theme.palette.common.white}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <SummaryCard
          title={t('reports.collected')}
          value={formatAmount(data.totalAmountPaid, storeSettings?.amountFormat)}
          subtitle={t('reports.overdue', {
            count: data.overdueCount
          })}
          bgColor={theme.palette.success.main}
          textColor={theme.palette.mode === Themes.dark ? theme.palette.common.black : theme.palette.common.white}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <SummaryCard
          title={t('reports.outstanding')}
          value={formatAmount(data.balanceDue, storeSettings?.amountFormat)}
          bgColor={theme.palette.warning.main}
          textColor={theme.palette.mode === Themes.dark ? theme.palette.common.black : theme.palette.common.white}
        />
      </Grid>
    </Grid>
  );
};
export const FinancialCards = memo(FinancialCardsComponent);
