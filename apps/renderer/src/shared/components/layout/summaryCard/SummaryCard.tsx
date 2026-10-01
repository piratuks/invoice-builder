import { Card, CardContent, Typography } from '@mui/material';
import type { FC } from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  bgColor: string;
  textColor: string;
}

export const SummaryCard: FC<SummaryCardProps> = ({ title, value, subtitle, bgColor, textColor }) => {
  return (
    <Card
      sx={{
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: 1,
        boxShadow: 3,
        height: '100%'
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.8 }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
