import { Box, Button } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateFormat } from '@invoice-builder/contracts';
import { Datepicker } from '../datepicker/Datepicker';

interface Props {
  valueFrom?: string;
  valueTo?: string;
  format: DateFormat;
  onChange?: (valueFrom?: string, valueTo?: string) => void;
}
export const UTCDateRangePicker: React.FC<Props> = ({ valueFrom, valueTo, format, onChange = () => {} }) => {
  const { t } = useTranslation();
  const [range, setRange] = useState<[string?, string?]>([valueFrom, valueTo]);

  const clearRange = () => {
    setRange([undefined, undefined]);
    onChange(undefined);
  };

  useEffect(() => {
    if (range[0] && range[1]) {
      onChange(range[0], range[1]);
    } else {
      onChange(undefined, undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        alignItems: 'center',
        width: '100%'
      }}
    >
      <Datepicker
        label={`${t('common.from')}`}
        value={range[0]}
        format={format}
        onChange={newValue => {
          setRange([newValue, range[1]]);
        }}
      />
      <Datepicker
        label={`${t('common.to')}`}
        value={range[1]}
        format={format}
        onChange={newValue => {
          setRange([range[0], newValue]);
        }}
      />

      <Button variant="outlined" onClick={clearRange}>
        {t('ariaLabel.clear')}
      </Button>
    </Box>
  );
};
