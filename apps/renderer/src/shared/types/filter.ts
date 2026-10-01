import type { FilterType } from '@invoice-builder/contracts';
import type { TFunction } from 'i18next';
import type { CustomOption } from './customOption';

type Options<T extends string | number | symbol> = CustomOption<T>[];
export interface Filter {
  value?: string;
  label: string;
  description?: string;
  initial?: boolean;
  isGroup?: boolean;
  type: FilterType;
  options?: Options<string | number | symbol>;
  shouldCloseOnClick?: boolean;
}

export interface FilterConfig {
  t: TFunction;
  namespace: string;
  initial?: FilterType;
  shouldCloseOnClick?: boolean;
}
