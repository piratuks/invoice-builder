import type { DbValue } from './dbValue';

export interface UpdateData {
  [key: string]: DbValue;
}
