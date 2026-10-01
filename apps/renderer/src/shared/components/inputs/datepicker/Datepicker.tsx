import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateFormat } from '@invoice-builder/contracts';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  label: string;
  value?: string;
  required?: boolean;
  error?: boolean;
  format: DateFormat;
  onChange?: (value?: string) => void;
}
export const Datepicker: React.FC<Props> = ({
  value,
  label,
  required = false,
  error = false,
  format,
  onChange = () => {}
}) => {
  const { t } = useTranslation();
  const [currValue, setCurrValue] = useState<string | undefined>(value);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);

  useEffect(() => {
    if (typeof selectedValue !== 'undefined') onChange(selectedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue]);

  useEffect(() => {
    setCurrValue(value);
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        sx={{ width: '100%' }}
        views={['year', 'month', 'day']}
        openTo="day"
        label={label}
        value={currValue ? dayjs.utc(currValue) : null}
        format={format.toUpperCase()}
        onChange={newValue => {
          if (!newValue) {
            setSelectedValue(undefined);
            return;
          }

          const now = dayjs();
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const combined = dayjs.tz(newValue?.format('YYYY-MM-DD') + ' ' + now.format('HH:mm:ss'), tz);

          const utcValue = combined?.utc().toISOString();
          setSelectedValue(utcValue);
        }}
        slotProps={{
          textField: {
            required: required,
            error: error,
            helperText: error ? t('common.fieldRequired') : '',
            onKeyDown: (e: React.KeyboardEvent) => {
              e.preventDefault();
            },
            slotProps: {
              input: {
                readOnly: true,
                startAdornment:
                  !required && currValue ? (
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        setCurrValue(undefined);
                        setSelectedValue(undefined);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : undefined
              }
            }
          }
        }}
      />
    </LocalizationProvider>
  );
};
