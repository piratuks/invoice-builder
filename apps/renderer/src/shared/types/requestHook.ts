import type { FilterData } from '@invoice-builder/contracts';

export interface RequestHook<T> {
  immediate?: boolean;
  showLoader?: boolean;
  filter?: FilterData[];
  onDone?: (data: T) => void;
}
