import { closeInactiveDatabases } from './database';
import { expireSessions, getActiveDatabaseKeys } from './session';

const cleanupIntervalMs = Number(process.env.WEBSERVER_CLEANUP_INTERVAL_MS) || 60_000;
let cleanupTimer: NodeJS.Timeout | undefined;

export const runCleanup = async () => {
  await expireSessions();
  await closeInactiveDatabases(getActiveDatabaseKeys());
};

export const startCleanupScheduler = () => {
  if (cleanupTimer) return cleanupTimer;
  cleanupTimer = setInterval(() => {
    void runCleanup().catch(error => console.error('Webserver session cleanup failed:', error));
  }, cleanupIntervalMs);
  cleanupTimer.unref();
  return cleanupTimer;
};

export const stopCleanupScheduler = () => {
  if (!cleanupTimer) return;
  clearInterval(cleanupTimer);
  cleanupTimer = undefined;
};
