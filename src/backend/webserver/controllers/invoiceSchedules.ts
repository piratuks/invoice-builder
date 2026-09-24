import { type Express, type Request, type Response } from 'express';
import * as invoiceSchedulesService from '../../shared/services/invoiceSchedules';
import { parseFilter, requireDB } from '../utils/functions';

export const initInvoiceSchedulesController = (app: Express) => {
  app.get('/api/invoice-schedules', requireDB, async (req: Request, res: Response) => {
    const filter = parseFilter(req.query.filter as string);
    const result = await invoiceSchedulesService.getAllInvoiceSchedules(req.db!, filter);
    res.json(result);
  });

  app.get('/api/invoice-schedules/:id/runs', requireDB, async (req: Request, res: Response) => {
    const result = await invoiceSchedulesService.getInvoiceScheduleRuns(req.db!, Number(req.params.id));
    res.json(result);
  });

  app.post('/api/invoice-schedules', requireDB, async (req: Request, res: Response) => {
    const result = await invoiceSchedulesService.addInvoiceSchedule(req.db!, req.body);
    res.json(result);
  });

  app.put('/api/invoice-schedules', requireDB, async (req: Request, res: Response) => {
    const result = await invoiceSchedulesService.updateInvoiceSchedule(req.db!, req.body);
    res.json(result);
  });

  app.delete('/api/invoice-schedules/:id', requireDB, async (req: Request, res: Response) => {
    const result = await invoiceSchedulesService.deleteInvoiceSchedule(req.db!, Number(req.params.id));
    res.json(result);
  });
};
