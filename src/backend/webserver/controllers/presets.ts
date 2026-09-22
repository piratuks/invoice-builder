import { type Express, type Request, type Response as ResponseExpress } from 'express';
import * as presetsService from '../../shared/services/presets';
import { decodePreset, encodeResultPreset } from '../../shared/utils/dataUrlFunctions';
import { parseFilter, requireDB } from '../utils/functions';

export const initPresetsController = (app: Express) => {
  app.get('/api/presets', requireDB, async (req: Request, res: ResponseExpress) => {
    const filter = parseFilter(req.query.filter as string);
    const result = await presetsService.getAllPresets(req.db!, filter);
    res.json(encodeResultPreset(result));
  });
  app.post('/api/presets', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await presetsService.addPreset(req.db!, decodePreset(req.body));
    res.json(encodeResultPreset(result));
  });
  app.put('/api/presets', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await presetsService.updatePreset(req.db!, decodePreset(req.body));
    res.json(encodeResultPreset(result));
  });
  app.delete('/api/presets/:id', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await presetsService.deletePreset(req.db!, Number(req.params.id));
    res.json(result);
  });
  app.post('/api/presets/batch', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await presetsService.batchAddPreset(req.db!, req.body);
    res.json(result);
  });
};
