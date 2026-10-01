import { IpcChannel } from '@invoice-builder/contracts';
import type { InvoiceAdd, InvoiceUpdate } from '@invoice-builder/contracts';
import { ipcMain } from 'electron';
import * as invoicesService from '@invoice-builder/core/services/invoices';
import { mapDatabaseError } from '@invoice-builder/core/utils/errorFunctions';
import { requireDatabase } from '../database';

export const initInvoicesHandlers = () => {
  ipcMain.handle(IpcChannel.getEinvoiceXml, async (event, data) => {
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

  ipcMain.handle(IpcChannel.getNextSequence, async (event, data) =>
    invoicesService.getNextSequence(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.getCustomHeaders, async (event, type) =>
    invoicesService.getCustomHeaders(requireDatabase(event), type)
  );
  ipcMain.handle(IpcChannel.getAllInvoices, async (event, type, filter) =>
    invoicesService.getAllInvoices(requireDatabase(event), type, filter)
  );
  ipcMain.handle(IpcChannel.deleteInvoice, async (event, id: number) =>
    invoicesService.deleteInvoice(requireDatabase(event), id)
  );
  ipcMain.handle(IpcChannel.addInvoice, async (event, data: InvoiceAdd) =>
    invoicesService.addInvoice(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.updateInvoice, async (event, data: InvoiceUpdate) =>
    invoicesService.updateInvoice(requireDatabase(event), data)
  );
  ipcMain.handle(IpcChannel.duplicateInvoice, async (event, invoiceId: number, invoiceType: 'quotation' | 'invoice') =>
    invoicesService.duplicateInvoice(requireDatabase(event), invoiceId, invoiceType)
  );
};
