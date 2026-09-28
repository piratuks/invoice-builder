import path from 'path';
import { getBackendConfig } from '../config';

describe('getBackendConfig', () => {
  it('provides backend defaults from one configuration boundary', () => {
    const config = getBackendConfig({}, 'project');

    expect(config.postgresPool).toEqual({
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      maxLifetimeSeconds: 0,
      allowExitOnIdle: false
    });
    expect(config.frontendUrl).toBe('http://127.0.0.1:5173');
    expect(config.electron.defaultDirectory).toBe('project');
    expect(config.webserver).toEqual({
      host: '127.0.0.1',
      port: 3000,
      databaseDirectory: 'data',
      migrationsPath: path.resolve('project', 'src', 'backend', 'shared', 'migrations'),
      cleanupIntervalMs: 60_000,
      sessionTtlMs: 1_800_000,
      version: '3.0.0'
    });
  });

  it('parses supported backend environment overrides', () => {
    const config = getBackendConfig({
      NODE_ENV: 'docker',
      USERPROFILE: 'C:\\Users\\invoice-builder',
      PG_POOL_MAX: '20',
      PG_POOL_IDLE_TIMEOUT_MS: '45000',
      PG_POOL_CONNECTION_TIMEOUT_MS: '7000',
      PG_POOL_MAX_LIFETIME_SECONDS: '600',
      PG_POOL_ALLOW_EXIT_ON_IDLE: 'true',
      DEV_SERVER_URL: '0.0.0.0',
      PORT: '4000',
      FE_SERVER_URL: 'https://invoice.example',
      DB_DIRECTORY: '/data',
      MIGRATIONS_PATH: '/migrations',
      WEBSERVER_CLEANUP_INTERVAL_MS: '120000',
      WEBSERVER_SESSION_TTL_MS: '3600000'
    });

    expect(config.nodeEnvironment).toBe('docker');
    expect(config.frontendUrl).toBe('https://invoice.example');
    expect(config.electron.defaultDirectory).toBe('C:\\Users\\invoice-builder');
    expect(config.postgresPool).toEqual({
      max: 20,
      idleTimeoutMillis: 45_000,
      connectionTimeoutMillis: 7_000,
      maxLifetimeSeconds: 600,
      allowExitOnIdle: true
    });
    expect(config.webserver).toMatchObject({
      host: '0.0.0.0',
      port: 4000,
      databaseDirectory: '/data',
      migrationsPath: '/migrations',
      cleanupIntervalMs: 120_000,
      sessionTtlMs: 3_600_000
    });
  });
});
