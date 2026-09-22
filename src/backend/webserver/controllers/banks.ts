import { type Express, type Request, type Response } from 'express';
import * as banksService from '../../shared/services/banks';
import { decodeBank, encodeResultBank } from '../../shared/utils/dataUrlFunctions';
import { parseFilter, requireDB } from '../utils/functions';

export const initBanksController = (app: Express) => {
  app.get('/api/banks', requireDB, async (req: Request, res: Response) => {
    const filter = parseFilter(req.query.filter as string);
    const result = await banksService.getAllBanks(req.db!, filter);
    res.json(encodeResultBank(result));
  });
  app.post('/api/banks', requireDB, async (req: Request, res: Response) => {
    const result = await banksService.addBank(req.db!, decodeBank(req.body));
    res.json(encodeResultBank(result));
  });
  app.put('/api/banks', requireDB, async (req: Request, res: Response) => {
    const result = await banksService.updateBank(req.db!, decodeBank(req.body));
    res.json(encodeResultBank(result));
  });
  app.delete('/api/banks/:id', requireDB, async (req: Request, res: Response) => {
    const result = await banksService.deleteBank(req.db!, Number(req.params.id));
    res.json(result);
  });
  app.post('/api/banks/batch', requireDB, async (req: Request, res: Response) => {
    const result = await banksService.batchAddBank(req.db!, req.body);
    res.json(result);
  });
};
