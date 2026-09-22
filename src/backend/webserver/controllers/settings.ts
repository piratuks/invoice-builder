import { type Express, type Request, type Response } from 'express';
import * as settingsService from '../../shared/services/settings';
import { requireDB } from '../utils/functions';

export const initSettingsController = (app: Express) => {
  app.get('/api/settings', requireDB, async (req: Request, res: Response) => {
    const result = await settingsService.getAllSettings(req.db!);
    res.json(result);
  });
  app.put('/api/settings', requireDB, async (req: Request, res: Response) => {
    const result = await settingsService.updateSettings(req.db!, req.body);
    res.json(result);
  });
};
