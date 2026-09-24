import { type Express, type Request, type Response } from 'express';
import { testDeliveryProvider } from '../../shared/services/deliveryProviders';
import * as settingsService from '../../shared/services/settings';
import { APP_CONFIG } from '../config';
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
  app.get('/api/settings/smtp-password-status', async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: { configured: Boolean(process.env.SMTP_PASSWORD || APP_CONFIG.SMTP_PASSWORD), source: 'env' }
    });
  });
  app.put('/api/settings/smtp-password', async (_req: Request, res: Response) => {
    res.json({ success: false, key: 'error.smtpPasswordEnvOnly' });
  });
  app.delete('/api/settings/smtp-password', async (_req: Request, res: Response) => {
    res.json({ success: false, key: 'error.smtpPasswordEnvOnly' });
  });
  app.post('/api/settings/smtp-test', requireDB, async (req: Request, res: Response) => {
    const result = await testDeliveryProvider(req.db!, {
      recipient: String(req.body?.recipient ?? ''),
      secrets: { smtpPassword: process.env.SMTP_PASSWORD || APP_CONFIG.SMTP_PASSWORD }
    });
    res.json(result);
  });
};
