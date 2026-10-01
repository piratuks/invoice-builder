import type { FilterType } from '../enums/filterType';

export interface FilterData {
  type: FilterType;
  value?: string;
}
