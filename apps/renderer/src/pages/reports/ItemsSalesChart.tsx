import { Box, Typography, useTheme } from '@mui/material';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, type PieLabelRenderProps } from 'recharts';
import type { ItemSales } from '../../shared/types/itemSales';
import { CustomLegend } from './CustomLegend';

interface Props {
  data: ItemSales[];
}

const ItemsSalesChartComponent: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const chartData = useMemo(() => {
    return data.map(client => ({
      name: t('reports.itemsCount', {
        name: client.name,
        count: client.quantity
      }),
      value: client.amount,
      color: getRandomColor()
    }));
  }, [data, t]);

  const renderPercentageLabel = ({
    cx,
    cy,
    midAngle = 0,
    innerRadius,
    outerRadius,
    percent = 0
  }: PieLabelRenderProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="600">
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color={theme.palette.text.primary}>
          {t('reports.topItems')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ flex: '0 0 300px', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={100}
                paddingAngle={2}
                labelLine={false}
                label={renderPercentageLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ ml: 3 }}>
          <CustomLegend chartData={chartData} />
        </Box>
      </Box>
    </Box>
  );
};
export const ItemsSalesChart = memo(ItemsSalesChartComponent);
