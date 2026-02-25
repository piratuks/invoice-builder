import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { APP_CONFIG } from './config';
import { initControllers } from './controllers';
import { initDatabaseController } from './controllers/database';

const port = Number(process.env.PORT) || Number(APP_CONFIG.PORT);
const server = process.env.DEV_SERVER_URL || APP_CONFIG.DEV_SERVER_URL;
const feServer = process.env.FE_SERVER_URL || APP_CONFIG.FE_SERVER_URL;
const host = process.env.NODE_ENV === 'docker' ? 'localhost' : server;
const version = APP_CONFIG.VERSION;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(
  cors({
    origin: feServer,
    credentials: true
  })
);
app.set('trust proxy', 1);

const main = async () => {
  initDatabaseController(app);
  initControllers(app);

  app.listen(port, server, () => {
    console.log(`Server listening at http://${host}:${port}`);
  });
  // app.get('*', (_req: Request, res: Response) => {
  //   res.sendFile(path.join(distPath, 'index.html'));
  // });
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });
  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ version: version });
  });
};

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
