export interface SortOrder {
  no: number;
  item: number;
  unit: number;
  quantity: number;
  unitCost: number;
  total: number;
  [key: string]: number;
}
