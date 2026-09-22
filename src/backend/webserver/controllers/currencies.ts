import { type Express, type Request, type Response } from 'express';
import * as currenciesService from '../../shared/services/currencies';
import { parseFilter, requireDB } from '../utils/functions';

export const initCurrenciesController = (app: Express) => {
  app.get('/api/currencies', requireDB, async (req: Request, res: Response) => {
    const filter = parseFilter(req.query.filter as string);
    const result = await currenciesService.getAllCurrencies(req.db!, filter);
    res.json(result);
  });
  app.post('/api/currencies', requireDB, async (req: Request, res: Response) => {
    const result = await currenciesService.addCurrency(req.db!, req.body);
    res.json(result);
  });
  app.put('/api/currencies', requireDB, async (req: Request, res: Response) => {
    const result = await currenciesService.updateCurrency(req.db!, req.body);
    res.json(result);
  });
  app.delete('/api/currencies/:id', requireDB, async (req: Request, res: Response) => {
    const result = await currenciesService.deleteCurrency(req.db!, Number(req.params.id));
    res.json(result);
  });
  app.post('/api/currencies/batch', requireDB, async (req: Request, res: Response) => {
    const result = await currenciesService.batchAddCurrency(req.db!, req.body);
    res.json(result);
  });
};
