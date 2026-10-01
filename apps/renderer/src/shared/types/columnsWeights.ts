export interface ColumnWeights {
  rowNo?: number;
  item?: number;
  quantity?: number;
  unit?: number;
  unitCost?: number;
  total?: number;
  [key: string]: number | undefined;
}
