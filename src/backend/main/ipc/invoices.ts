import { ipcMain } from 'electron';
import * as invoicesService from '../../shared/services/invoices';
import type { Invoice } from '../../shared/types/invoice';
import { mapDatabaseError } from '../../shared/utils/errorFunctions';
import { requireDatabase } from '../database';

export const initInvoicesHandlers = () => {
  ipcMain.handle('get-einvoice-xml', async (event, data) => {
    const db = requireDatabase(event);
    try {
      const result = await invoicesService.getInvoiceXML(db, data);
      if (!result.success) return result;

      const xmlBuffer = Buffer.from(result.data.xml, 'utf-8');

      return { success: true, data: xmlBuffer };
    } catch (error) {
      return { success: false, ...mapDatabaseError(error, db.type) };
    }
  });

  ipcMain.handle('get-next-sequence', async (event, data) =>
    invoicesService.getNextSequence(requireDatabase(event), data)
  );
  ipcMain.handle('get-custom-headers', async (event, type) =>
    invoicesService.getCustomHeaders(requireDatabase(event), type)
  );
  ipcMain.handle('get-all-invoices', async (event, type, filter) =>
    invoicesService.getAllInvoices(requireDatabase(event), type, filter)
  );
  ipcMain.handle('delete-invoice', async (event, id: number) =>
    invoicesService.deleteInvoice(requireDatabase(event), id)
  );
  ipcMain.handle('add-invoice', async (event, data: Invoice) =>
    invoicesService.addInvoice(requireDatabase(event), data)
  );
  ipcMain.handle('update-invoice', async (event, data: Invoice) =>
    invoicesService.updateInvoice(requireDatabase(event), data)
  );
  ipcMain.handle('duplicate-invoice', async (event, invoiceId: number, invoiceType: 'quotation' | 'invoice') =>
    invoicesService.duplicateInvoice(requireDatabase(event), invoiceId, invoiceType)
  );
};
