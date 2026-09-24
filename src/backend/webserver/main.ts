import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { startCleanupScheduler, stopCleanupScheduler } from './cleanup';
import { APP_CONFIG } from './config';
import { initControllers } from './controllers';
import { initDatabaseController } from './controllers/database';
import { closeAllDatabases, getDatabaseKeyFromRequest, getRequestDatabase, registerSessionDatabase } from './database';
import { startWebInvoiceScheduleRuntime, stopWebInvoiceScheduleRuntime } from './invoiceScheduleRuntime';
import { authenticateSession, getSessionTokenFromRequest } from './session';
import { createSessionAuthorizationLimiter } from './utils/functions';

const port = Number(process.env.PORT) || Number(APP_CONFIG.PORT);
const server = process.env.DEV_SERVER_URL || APP_CONFIG.DEV_SERVER_URL;
const feServer = process.env.FE_SERVER_URL || APP_CONFIG.FE_SERVER_URL;
const host = process.env.NODE_ENV === 'docker' ? 'localhost' : server;
const version = APP_CONFIG.VERSION;

const isDatabaseBootstrapRequest = (req: Request) =>
  (req.path === '/api/databases' && (req.method === 'GET' || req.method === 'POST')) ||
  (req.path === '/api/databases/test' && req.method === 'POST');

const app = express();
app.set('trust proxy', 1);
app.use(
  cors({
    origin: feServer,
    credentials: true
  })
);
app.use(express.json({ limit: '50mb' }));
export const sessionDatabaseMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getSessionTokenFromRequest(req);
    const session = token ? await authenticateSession(token) : undefined;

    if (token && !session && !isDatabaseBootstrapRequest(req)) {
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
    const databaseKey = session?.databaseKey ?? getDatabaseKeyFromRequest(req);
    if (session && databaseKey) {
      registerSessionDatabase({ sessionId: session.token, workspaceId: session.workspaceId, databaseKey });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const databaseContextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const requestDb = getRequestDatabase(req);
  if (requestDb) req.db = requestDb;
  next();
};

app.use(createSessionAuthorizationLimiter());
app.use(sessionDatabaseMiddleware);
app.use(databaseContextMiddleware);

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
  startCleanupScheduler();
  startWebInvoiceScheduleRuntime();
  const httpServer = app.listen(port, server, () => {
    console.log(`Server listening at http://${host}:${port}`);
  });
  const shutdown = async () => {
    stopCleanupScheduler();
    stopWebInvoiceScheduleRuntime();
    await closeAllDatabases();
    httpServer.close(() => process.exit(0));
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
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
