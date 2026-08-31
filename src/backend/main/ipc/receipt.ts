import { BrowserWindow, ipcMain } from 'electron';

export const initReceiptHandlers = () => {
  ipcMain.handle('print-receipt', async (_event, html: string) => {
    let printWindow: BrowserWindow | null = null;

    try {
      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          sandbox: true
        }
      });

      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

      const printResult = await new Promise<{ success: boolean; failureReason?: string }>(resolve => {
        printWindow!.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
          resolve({ success, failureReason });
        });
      });

      if (!printResult.success) {
        return { success: false, key: 'error.printFailed', message: printResult.failureReason };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        key: 'error.printFailed',
        message: error instanceof Error ? error.message : String(error)
      };
    } finally {
      if (printWindow && !printWindow.isDestroyed()) printWindow.close();
    }
  });
};
