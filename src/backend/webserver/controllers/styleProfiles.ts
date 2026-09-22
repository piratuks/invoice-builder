import { type Express, type Request, type Response as ResponseExpress } from 'express';
import * as styleProfilesService from '../../shared/services/styleProfiles';
import { decodeStyleProfile, encodeResultStyleProfile } from '../../shared/utils/dataUrlFunctions';
import { parseFilter, requireDB } from '../utils/functions';

export const initStyleProfilesController = (app: Express) => {
  app.get('/api/styleProfiles', requireDB, async (req: Request, res: ResponseExpress) => {
    const filter = parseFilter(req.query.filter as string);
    const result = await styleProfilesService.getAllStyleProfiles(req.db!, filter);
    res.json(encodeResultStyleProfile(result));
  });
  app.post('/api/styleProfiles', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await styleProfilesService.addStyleProfile(req.db!, decodeStyleProfile(req.body));
    res.json(encodeResultStyleProfile(result));
  });
  app.put('/api/styleProfiles', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await styleProfilesService.updateStyleProfile(req.db!, decodeStyleProfile(req.body));
    res.json(encodeResultStyleProfile(result));
  });
  app.delete('/api/styleProfiles/:id', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await styleProfilesService.deleteStyleProfile(req.db!, Number(req.params.id));
    res.json(result);
  });
  app.post('/api/styleProfiles/batch', requireDB, async (req: Request, res: ResponseExpress) => {
    const result = await styleProfilesService.batchAddStyleProfile(req.db!, req.body);
    res.json(result);
  });
};
