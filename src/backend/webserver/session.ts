import { randomBytes, randomUUID } from 'crypto';
import type { Request } from 'express';

export type WebSession = {
  token: string;
  workspaceId: string;
  databaseKey?: string;
  expiresAt: number;
  lastAccessAt: number;
};

const sessionTtlMs = Number(process.env.WEBSERVER_SESSION_TTL_MS) || 30 * 60 * 1000;
const sessions = new Map<string, WebSession>();

export const issueSession = (workspaceId?: string): WebSession => {
  const now = Date.now();
  const session: WebSession = {
    token: randomBytes(32).toString('hex'),
    workspaceId: workspaceId?.trim() || `workspace-${randomUUID()}`,
    expiresAt: now + sessionTtlMs,
    lastAccessAt: now
  };
  sessions.set(session.token, session);
  return session;
};

export const getSession = (token?: string): WebSession | undefined => {
  if (!token) return undefined;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessions.delete(token);
    return undefined;
  }
  return session;
};

export const authenticateSession = (token?: string): WebSession | undefined => {
  const session = getSession(token);
  if (!session) return undefined;
  const now = Date.now();
  session.lastAccessAt = now;
  session.expiresAt = now + sessionTtlMs;
  return session;
};

export const bindSessionDatabase = (token: string, databaseKey: string) => {
  const session = getSession(token);
  if (!session) throw new Error('error.sessionExpired');
  if (session.databaseKey && session.databaseKey !== databaseKey) {
    throw new Error('error.workspaceDatabaseConflict');
  }
  session.databaseKey = databaseKey;
  return session;
};

export const getSessionTokenFromRequest = (req: Request) => {
  const raw = req.headers['x-session-token'];
  return Array.isArray(raw) ? raw[0] : raw;
};

export const expireSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
};

export const clearSessions = () => sessions.clear();
export const revokeSession = (token: string) => sessions.delete(token);
export const getSessionStore = () => sessions;
