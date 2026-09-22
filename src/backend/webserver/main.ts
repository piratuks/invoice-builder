import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { APP_CONFIG } from './config';
import { initControllers } from './controllers';
import { initDatabaseController } from './controllers/database';
import { getDatabaseKeyFromRequest, getRequestDatabase, registerSessionDatabase } from './database';
import { authenticateSession, getSessionTokenFromRequest } from './session';

const port = Number(process.env.PORT) || Number(APP_CONFIG.PORT);
const server = process.env.DEV_SERVER_URL || APP_CONFIG.DEV_SERVER_URL;
const feServer = process.env.FE_SERVER_URL || APP_CONFIG.FE_SERVER_URL;
const host = process.env.NODE_ENV === 'docker' ? 'localhost' : server;
const version = APP_CONFIG.VERSION;

const app = express();
app.use(express.json({ limit: '50mb' }));
export const sessionDatabaseMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const token = getSessionTokenFromRequest(req);
  const session = token ? authenticateSession(token) : undefined;

  if (token && !session) {
    _res.status(401).json({ success: false, key: 'error.sessionExpired' });
    return;
  }

  const requestedWorkspaceId =
    typeof req.headers['x-workspace-id'] === 'string' ? req.headers['x-workspace-id'] : undefined;
  if (session && requestedWorkspaceId && requestedWorkspaceId !== session.workspaceId) {
    _res.status(403).json({ success: false, key: 'error.workspaceAccessDenied' });
    return;
  }
  const requestedDatabaseKey =
    typeof req.headers['x-database-key'] === 'string' ? req.headers['x-database-key'] : undefined;
  if (session?.databaseKey && requestedDatabaseKey && requestedDatabaseKey !== session.databaseKey) {
    _res.status(403).json({ success: false, key: 'error.databaseAccessDenied' });
    return;
  }

  req.sessionId = session?.token;
  req.workspaceId = session?.workspaceId;
  const databaseKey = getDatabaseKeyFromRequest(req);
  if (session && databaseKey) {
    registerSessionDatabase({ sessionId: session.token, workspaceId: session.workspaceId, databaseKey });
  }
  next();
};

export const databaseContextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const requestDb = getRequestDatabase(req);
  if (requestDb) req.db = requestDb;
  next();
};

app.use(sessionDatabaseMiddleware);
app.use(databaseContextMiddleware);
app.use(
  cors({
    origin: feServer,
    credentials: true
  })
);
app.set('trust proxy', 1);

export const createApp = () => {
  initDatabaseController(app);
  initControllers(app);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });
  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ version: version });
  });
  return app;
};

const main = async () => {
  createApp();
  app.listen(port, server, () => {
    console.log(`Server listening at http://${host}:${port}`);
  });
  // app.get('*', (_req: Request, res: Response) => {
  //   res.sendFile(path.join(distPath, 'index.html'));
  // });
};

if (process.env.NODE_ENV !== 'test') {
  main().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
