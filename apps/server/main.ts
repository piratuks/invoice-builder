import cors from 'cors';
import express, { Router, type Express, type NextFunction, type Request, type Response } from 'express';
import type { Server } from 'node:http';
import { getBackendConfig } from '@invoice-builder/core/config';
import { startCleanupScheduler, stopCleanupScheduler } from './cleanup';
import { initControllers } from './controllers';
import { initDatabaseController } from './controllers/database';
import { closeAllDatabases, getDatabaseKeyFromRequest, getRequestDatabase, registerSessionDatabase } from './database';
import { authenticateSession, getSessionTokenFromRequest } from './session';
import { createSessionAuthorizationLimiter } from './utils/functions';
import { onEditionServerStarted, onEditionServerStopping, registerEditionRoutes } from './edition';

const backendConfig = getBackendConfig();
const { frontendUrl: feServer } = backendConfig;
const { port, host: server, version } = backendConfig.webserver;
const host = backendConfig.nodeEnvironment === 'docker' ? 'localhost' : server;

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

  const editionRouter = Router();
  registerEditionRoutes(editionRouter);
  app.use('/api/edition', editionRouter);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });
  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ version: version });
  });
  return app;
};

const waitUntilListening = (httpServer: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    const onListening = () => {
      httpServer.off('error', onError);
      resolve();
    };
    const onError = (error: Error) => {
      httpServer.off('listening', onListening);
      reject(error);
    };
    httpServer.once('listening', onListening);
    httpServer.once('error', onError);
  });

const closeHttpServer = (httpServer: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    httpServer.close(error => (error ? reject(error) : resolve()));
  });

export const startHttpServer = async (serverApp: Express, listenPort = port, listenHost = server): Promise<Server> => {
  const httpServer = serverApp.listen(listenPort, listenHost);
  try {
    await waitUntilListening(httpServer);
    console.log(`Server listening at http://${host}:${listenPort}`);
    await onEditionServerStarted();
    return httpServer;
  } catch (error) {
    const errors: unknown[] = [error];
    if (httpServer.listening) {
      try {
        await closeHttpServer(httpServer);
      } catch (closeError) {
        errors.push(closeError);
      }
    }
    if (errors.length > 1) throw new AggregateError(errors, 'Server startup and cleanup failed.');
    throw error;
  }
};

export const stopHttpServer = async (
  httpServer: Server,
  closeDatabases: () => Promise<void> = closeAllDatabases
): Promise<void> => {
  const errors: unknown[] = [];
  try {
    await onEditionServerStopping();
  } catch (error) {
    errors.push(error);
  }
  try {
    await closeDatabases();
  } catch (error) {
    errors.push(error);
  }
  if (httpServer.listening) {
    try {
      await closeHttpServer(httpServer);
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, 'Server shutdown failed.');
};

const main = async () => {
  const serverApp = createApp();
  startCleanupScheduler();
  let httpServer: Server;
  try {
    httpServer = await startHttpServer(serverApp);
  } catch (error) {
    stopCleanupScheduler();
    throw error;
  }
  const shutdown = async () => {
    stopCleanupScheduler();
    await stopHttpServer(httpServer);
  };
  const handleShutdown = () => {
    void shutdown()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Failed to stop server:', error);
        process.exit(1);
      });
  };
  process.once('SIGINT', handleShutdown);
  process.once('SIGTERM', handleShutdown);
  // app.get('*', (_req: Request, res: Response) => {
  //   res.sendFile(path.join(distPath, 'index.html'));
  // });
};

if (backendConfig.nodeEnvironment !== 'test') {
  main().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
