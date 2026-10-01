import { Box, Typography } from '@mui/material';
import { memo, type FC } from 'react';
import { formatAmount } from '../../shared/utils/formatFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

interface CustomProps {
  chartData: {
    name: string;
    value: number;
    color: string;
  }[];
}
const CustomLegendComponent: FC<CustomProps> = ({ chartData }) => {
  const storeSettings = useAppSelector(selectSettings);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {chartData?.map((entry, index) => {
        const revenue = storeSettings
          ? entry
            ? formatAmount(entry.value, storeSettings.amountFormat)
            : 0
          : entry.value;

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '3px',
                backgroundColor: entry.color
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {entry?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {revenue}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
export const CustomLegend = memo(CustomLegendComponent);
