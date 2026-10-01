import { Paper, Typography, useTheme } from '@mui/material';
import { memo } from 'react';
import { type TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { formatAmount, formatDate } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

type TrendTooltipProps = TooltipContentProps<ValueType, NameType>;

const CustomTooltipComponent: React.FC<TrendTooltipProps> = ({ active, payload, label }) => {
  const theme = useTheme();
  const storeSettings = useAppSelector(selectSettings);

  if (!active || !payload || payload.length === 0) return null;

  const value = payload[0].value;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {storeSettings && label && formatDate(label.toString(), storeSettings.dateFormat)}
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {storeSettings && formatAmount(value as unknown as number, storeSettings.amountFormat)}
      </Typography>
    </Paper>
  );
};
export const CustomTooltip = memo(CustomTooltipComponent);
