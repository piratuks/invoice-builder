import { type Express, type Request, type Response } from 'express';
import multer from 'multer';
import { ungzip } from 'pako';
import * as importExportService from '../../shared/services/importExport';
import { requireDB } from '../utils/functions';

const upload = multer();

export const initImportExportController = (app: Express) => {
  app.get('/api/export', requireDB, async (req: Request, res: Response) => {
    const result = await importExportService.exportAllData(req.db!);
    res.json(result);
  });
  app.post('/api/import', requireDB, upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ success: false, key: 'error.invalidFile' });

    try {
      const decompressed = ungzip(req.file.buffer, { toText: true });

      const parsed = JSON.parse(decompressed);

      const result = await importExportService.importAllData(req.db!, parsed as Record<string, unknown>);
      res.json(result);
    } catch {
      res.status(400).json({ success: false, key: 'error.invalidFile' });
    }
  });
};
