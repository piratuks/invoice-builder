import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { TFunction } from 'i18next';
import type { Columns, Row, Rows, RowValue, SheetData } from '../types/excel';

export const exportExcel = async (sheets: SheetData[], fileName = 'export.xlsx') => {
  const workbook = new ExcelJS.Workbook();

  for (const { name, columns, rows } of sheets) {
    const sheet = workbook.addWorksheet(name);

    if (!rows || rows.length === 0) continue;

    const headers = columns ?? Object.keys(rows[0]);
    sheet.addRow(headers);

    // Add rows
    for (const row of rows) {
      const rowValues = headers.map(h => row[h]);
      sheet.addRow(rowValues);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
};

export const importExcel = async (
  t: TFunction<'translation', undefined>,
  file: File
): Promise<{ columns: Columns; rows: Rows }> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error(t('error.noWorksheetFound'));

  const headerRow = sheet.getRow(1);
  if (!headerRow || !headerRow.hasValues) {
    throw new Error(t('error.headerRowEmpty'));
  }

  const headerValuesArray = Array.isArray(headerRow.values) ? headerRow.values : Object.values(headerRow.values);
  const columns: Columns = headerValuesArray.slice(1).map(v => String(v ?? ''));

  const rows: Rows = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: Row = {} as Row;
    columns.forEach((col, i) => {
      const cellValue = row.getCell(i + 1).value as RowValue;

      rowData[col] = cellValue;
    });
    rows.push(rowData);
  });

  return { columns, rows };
};
