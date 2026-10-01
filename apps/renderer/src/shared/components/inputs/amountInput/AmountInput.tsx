import { TextField } from '@mui/material';
import type { FC, ReactNode } from 'react';
import { NumericFormat } from 'react-number-format';
import { AmountFormat } from '@invoice-builder/contracts';
import { getFormattingMeta } from '../../../utils/formatFunctions';

interface Props {
  value?: number;
  onChange?: (valueInCents?: number) => void;
  amountFormat?: AmountFormat;
  label: string;
  required: boolean;
  error?: boolean;
  helperText?: ReactNode;
  min?: number;
  max?: number;
  decimalScale?: number;
}
export const AmountInput: FC<Props> = ({
  value,
  onChange = () => {},
  amountFormat,
  label,
  required,
  error,
  min = 0,
  max,
  helperText,
  decimalScale
}) => {
  const { hasDecimal, thousand, decimal } = amountFormat ? getFormattingMeta(amountFormat) : {};

  return (
    <NumericFormat
      customInput={TextField}
      label={label}
      fullWidth
      min={min}
      max={max}
      error={error}
      helperText={helperText}
      required={required}
      value={value}
      thousandSeparator={thousand}
      decimalSeparator={decimalScale !== undefined ? '.' : hasDecimal ? decimal : undefined}
      decimalScale={decimalScale !== undefined ? decimalScale : hasDecimal ? 2 : 0}
      fixedDecimalScale={decimalScale !== undefined ? false : hasDecimal}
      allowNegative={false}
      isAllowed={({ floatValue }) => {
        if (typeof floatValue !== 'number') return true;
        if (max !== undefined && floatValue > max) return false;
        if (min !== undefined && floatValue < min) return false;
        return true;
      }}
      onValueChange={values => {
        let { floatValue } = values;

        if (typeof floatValue === 'number') {
          if (max !== undefined && floatValue > max) floatValue = max;
          if (min !== undefined && floatValue < min) floatValue = min;
        }

        onChange(floatValue);
      }}
    />
  );
};
