import { ipcMain } from 'electron';
import * as invoiceSchedulesService from '../../shared/services/invoiceSchedules';
import type { FilterData } from '../../shared/types/invoiceFilter';
import type { InvoiceScheduleAdd, InvoiceScheduleUpdate } from '../../shared/types/invoiceSchedule';
import { requireDatabase } from '../database';

export const initInvoiceSchedulesHandlers = () => {
  ipcMain.handle('get-all-invoice-schedules', async (event, filter?: FilterData[]) =>
    invoiceSchedulesService.getAllInvoiceSchedules(requireDatabase(event), filter)
  );
  ipcMain.handle('get-invoice-schedule-runs', async (event, scheduleId: number) =>
    invoiceSchedulesService.getInvoiceScheduleRuns(requireDatabase(event), scheduleId)
  );
  ipcMain.handle('add-invoice-schedule', async (event, data: InvoiceScheduleAdd) =>
    invoiceSchedulesService.addInvoiceSchedule(requireDatabase(event), data)
  );
  ipcMain.handle('update-invoice-schedule', async (event, data: InvoiceScheduleUpdate) =>
    invoiceSchedulesService.updateInvoiceSchedule(requireDatabase(event), data)
  );
  ipcMain.handle('delete-invoice-schedule', async (event, id: number) =>
    invoiceSchedulesService.deleteInvoiceSchedule(requireDatabase(event), id)
  );
};
