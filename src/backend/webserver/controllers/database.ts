import { type Express, type Request, type Response } from 'express';
import fsPromise from 'fs/promises';
import path from 'path';
import { testPostgresConnection } from '../../shared/db/setup';
import { DatabaseType } from '../../shared/enums/databaseType';
import { DBInitType } from '../../shared/enums/dbInitType';
import { APP_CONFIG } from '../config';
import { setupDB } from '../database';
import { bindSessionDatabase, getSessionTokenFromRequest, issueSession, revokeSession } from '../session';
import { listDbLimiter } from '../utils/functions';

export const dbDir = path.resolve(process.cwd(), process.env.DB_DIRECTORY || APP_CONFIG.DB_DIRECTORY);

export const initDatabaseController = (app: Express) => {
  app.get('/api/databases', listDbLimiter, async (_req: Request, res: Response) => {
    try {
      const files = await fsPromise.readdir(dbDir);
      const dbFiles = files.filter(f => f.endsWith('.db') || f.endsWith('.sqlite') || f.endsWith('.sqlite3'));

      res.json({
        success: true,
        data: dbFiles
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: (err as Error).message
      });
    }
  });
  app.post('/api/databases/test', async (req: Request, res: Response) => {
    try {
      const postgresConfig = req.body;

      if (postgresConfig.host === 'localhost') {
        postgresConfig.host = 'host.docker.internal';
      }

      await testPostgresConnection(postgresConfig);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  });
  app.post('/api/databases', async (req: Request, res: Response) => {
    let sessionToken: string | undefined;
    try {
      const name = String(req.body?.fullPath ?? '');
      const mode = String(req.body?.mode ?? '');
      const dbType = req.body?.dbType ?? DatabaseType.sqlite;
      const postgresConfig = req.body?.postgresConfig;
      const databaseKey = String(req.body?.databaseKey ?? '');
      const workspaceId = String(req.body?.workspaceId ?? '');
      const existingToken = getSessionTokenFromRequest(req);
      const session =
        req.sessionId && existingToken ? { token: req.sessionId, workspaceId: req.workspaceId } : undefined;
      sessionToken = session?.token ?? issueSession(workspaceId || undefined).token;
      const selectedWorkspaceId = session?.workspaceId ?? (workspaceId || undefined);
      const fullPath = path.resolve(dbDir, name);
      const createIfMissing = mode === DBInitType.create || typeof mode === 'undefined';

      if (process.env.NODE_ENV === 'docker' && postgresConfig && postgresConfig.host === 'localhost') {
        postgresConfig.host = 'host.docker.internal';
      }

      await setupDB({
        sqliteConfig: { fullPath: fullPath },
        dbType: dbType,
        createIfMissing,
        postgresConfig: postgresConfig,
        databaseKey,
        sessionId: sessionToken,
        workspaceId: selectedWorkspaceId
      });
      bindSessionDatabase(sessionToken, databaseKey);
      res.json({ success: true, sessionToken, workspaceId: selectedWorkspaceId });
    } catch (err) {
      if (sessionToken && sessionToken !== req.sessionId) revokeSession(sessionToken);
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  });
};
