import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import { getColumnType } from '../utils/dbHelper';
import { mapDatabaseError } from '../utils/errorFunctions';

export const up = async (db: DatabaseAdapter) => {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS workspaces (
        "workspaceId" TEXT PRIMARY KEY,
        "databaseKey" TEXT,
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        "token" TEXT PRIMARY KEY,
        "workspaceId" TEXT NOT NULL,
        "databaseKey" TEXT,
        "createdAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
        "updatedAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
        "expiresAt" ${getColumnType('DATETIME', db.type)} NOT NULL,
        FOREIGN KEY ("workspaceId") REFERENCES workspaces("workspaceId")
      )
    `);
    await db.run('CREATE INDEX IF NOT EXISTS idx_sessions_workspaceId ON sessions("workspaceId")');
    await db.run('CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions("expiresAt")');
  } catch (error) {
    return { success: false, ...mapDatabaseError(error, db.type) };
  }
};
