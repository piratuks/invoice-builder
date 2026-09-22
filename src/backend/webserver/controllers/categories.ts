import { type Express, type Request, type Response } from 'express';
import * as categoriesService from '../../shared/services/categories';
import { parseFilter, requireDB } from '../utils/functions';

export const initCategoriesController = (app: Express) => {
  app.get('/api/categories', requireDB, async (req: Request, res: Response) => {
    const filter = parseFilter(req.query.filter as string);
    const result = await categoriesService.getAllCategories(req.db!, filter);
    res.json(result);
  });
  app.post('/api/categories', requireDB, async (req: Request, res: Response) => {
    const result = await categoriesService.addCategory(req.db!, req.body);
    res.json(result);
  });
  app.put('/api/categories', requireDB, async (req: Request, res: Response) => {
    const result = await categoriesService.updateCategory(req.db!, req.body);
    res.json(result);
  });
  app.delete('/api/categories/:id', requireDB, async (req: Request, res: Response) => {
    const result = await categoriesService.deleteCategory(req.db!, Number(req.params.id));
    res.json(result);
  });
  app.post('/api/categories/batch', requireDB, async (req: Request, res: Response) => {
    const result = await categoriesService.batchAddCategory(req.db!, req.body);
    res.json(result);
  });
};
