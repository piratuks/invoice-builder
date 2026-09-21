import ExcelJS from 'exceljs';
import { exportExcel, importExcel } from '../shared/utils/fileFunctions';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const t = ((key: string) => key) as never;

describe('exportExcel', () => {
  it('creates a workbook with headers and rows and saves it', async () => {
    const { saveAs } = await import('file-saver');

    await exportExcel(
      [{ name: 'Sheet1', columns: ['name', 'qty'], rows: [{ name: 'Item A', qty: 2 }] }],
      'invoices.xlsx'
    );

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, fileName] = vi.mocked(saveAs).mock.calls[0];
    expect(fileName).toBe('invoices.xlsx');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('skips sheets without rows', async () => {
    const { saveAs } = await import('file-saver');
    vi.mocked(saveAs).mockClear();

    await exportExcel([{ name: 'Empty', columns: ['a'], rows: [] }]);
    expect(saveAs).toHaveBeenCalledTimes(1);
  });

  it('derives headers from row keys when columns are not provided', async () => {
    const { saveAs } = await import('file-saver');
    vi.mocked(saveAs).mockClear();

    await exportExcel([{ name: 'Sheet1', rows: [{ a: 1, b: 2 }] }]);
    expect(saveAs).toHaveBeenCalledTimes(1);
  });
});

describe('importExcel', () => {
  const buildWorkbookFile = async (): Promise<File> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    sheet.addRow(['name', 'qty']);
    sheet.addRow(['Item A', 2]);
    const buffer = await workbook.xlsx.writeBuffer();
    return new File([buffer as ArrayBuffer], 'import.xlsx');
  };

  it('parses columns and rows from the first worksheet', async () => {
    const file = await buildWorkbookFile();
    const result = await importExcel(t, file);

    expect(result.columns).toEqual(['name', 'qty']);
    expect(result.rows).toEqual([{ name: 'Item A', qty: 2 }]);
  });

  it('throws when the header row is empty', async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Sheet1');
    const buffer = await workbook.xlsx.writeBuffer();
    const file = new File([buffer as ArrayBuffer], 'empty.xlsx');

    await expect(importExcel(t, file)).rejects.toThrow('error.headerRowEmpty');
  });
});
