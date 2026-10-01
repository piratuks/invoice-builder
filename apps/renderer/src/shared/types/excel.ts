export type ColumnName = string;
export type Columns = ColumnName[];
export type RowValue = string | number | boolean | null | Blob | Date | undefined;
export type Row = Record<ColumnName, RowValue>;
export type Rows = Row[];
export interface SheetData {
  name: string;
  columns?: Columns;
  rows: Rows;
}
