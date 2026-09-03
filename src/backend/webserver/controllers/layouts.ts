import { type Express, type Request, type Response } from 'express';
import * as service from '../../shared/services/layouts';
import { dbInstance } from '../database';
import { parseFilter, requireDB } from '../utils/functions';

export const initLayoutsController = (app: Express) => {
  app.get('/api/layouts', requireDB, async (req: Request, res: Response) =>
    res.json(await service.getAllLayouts(dbInstance!, parseFilter(req.query.filter as string)))
  );
  app.post('/api/layouts', requireDB, async (req: Request, res: Response) =>
    res.json(await service.addLayout(dbInstance!, req.body))
  );
  app.put('/api/layouts', requireDB, async (req: Request, res: Response) =>
    res.json(await service.updateLayout(dbInstance!, req.body))
  );
  app.delete('/api/layouts/:id', requireDB, async (req: Request, res: Response) =>
    res.json(await service.deleteLayout(dbInstance!, Number(req.params.id)))
  );
  app.get('/api/layouts/export/:id', requireDB, async (req: Request, res: Response) => {
    const result = await service.exportLayout(dbInstance!, Number(req.params.id));
    res.json(result);
  });
};
