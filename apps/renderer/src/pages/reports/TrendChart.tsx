import { Box, Typography, useTheme } from '@mui/material';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';
import { CustomTooltip } from './CustomTooltip';

interface Props {
  data: { date: string; total: number }[];
}
const TrendChartComponent: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color={theme.palette.text.primary}>
          {t('reports.salesTrending')}
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={value => (storeSettings ? formatDate(value, storeSettings.dateFormat) : value)}
          />
          <YAxis tickFormatter={value => `${(value / 1000).toFixed(0)}K`} />
          <Tooltip content={props => <CustomTooltip {...props} />} />
          <Line type="monotone" dataKey="total" stroke={theme.palette.primary.main} strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};
export const TrendChart = memo(TrendChartComponent);
