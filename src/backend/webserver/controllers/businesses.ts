import { type Express, type Request, type Response as ResponseExpress } from 'express';
import * as businessesService from '../../shared/services/businesses';
import { decodeLogo, encodeResultBusiness } from '../../shared/utils/dataUrlFunctions';
import { parseFilter, requireDB } from '../utils/functions';

export const initBusinessesController = (app: Express) => {
  app.get('/api/businesses', requireDB, async (req: Request, res: ResponseExpress) => {
    const filter = parseFilter(req.query.filter as string);
    const result = await businessesService.getAllBusinesses(req.db!, filter);
    res.json(encodeResultBusiness(result));
  });
  app.post('/api/businesses', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await businessesService.addBusiness(req.db!, decodeLogo(req.body));
    res.json(encodeResultBusiness(result));
  });
  app.put('/api/businesses', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await businessesService.updateBusiness(req.db!, decodeLogo(req.body));
    res.json(encodeResultBusiness(result));
  });
  app.delete('/api/businesses/:id', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await businessesService.deleteBusiness(req.db!, Number(req.params.id));
    res.json(result);
  });
  app.post('/api/businesses/batch', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await businessesService.batchAddBusiness(req.db!, req.body);
    res.json(result);
  });
};
