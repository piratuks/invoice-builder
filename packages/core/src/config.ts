import path from 'path';

const numberFromEnvironment = (value: string | undefined, fallback: number) => Number(value) || fallback;

export const getBackendConfig = (environment: NodeJS.ProcessEnv = process.env, workingDirectory = process.cwd()) => ({
  nodeEnvironment: environment.NODE_ENV,
  databaseName: 'invoice_builder',
  frontendUrl: environment.FE_SERVER_URL || 'http://127.0.0.1:5173',
  electron: {
    defaultDirectory: environment.USERPROFILE || workingDirectory
  },
  postgresPool: {
    max: numberFromEnvironment(environment.PG_POOL_MAX, 10),
    idleTimeoutMillis: numberFromEnvironment(environment.PG_POOL_IDLE_TIMEOUT_MS, 30_000),
    connectionTimeoutMillis: numberFromEnvironment(environment.PG_POOL_CONNECTION_TIMEOUT_MS, 5_000),
    maxLifetimeSeconds: numberFromEnvironment(environment.PG_POOL_MAX_LIFETIME_SECONDS, 0),
    allowExitOnIdle: environment.PG_POOL_ALLOW_EXIT_ON_IDLE === 'true'
  },
  webserver: {
    host: environment.DEV_SERVER_URL || '127.0.0.1',
    port: numberFromEnvironment(environment.PORT, 3000),
    databaseDirectory: environment.DB_DIRECTORY || 'app-data',
    migrationsPath: environment.MIGRATIONS_PATH || path.resolve(workingDirectory, 'dist-migrations'),
    cleanupIntervalMs: numberFromEnvironment(environment.WEBSERVER_CLEANUP_INTERVAL_MS, 60_000),
    sessionTtlMs: numberFromEnvironment(environment.WEBSERVER_SESSION_TTL_MS, 30 * 60 * 1000),
    version: '3.0.4'
  }
});
