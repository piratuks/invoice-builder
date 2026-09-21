import fs from 'fs';
import os from 'os';
import path from 'path';
import { openPostgreSql, openSqlLite, testPostgresConnection } from '../setup';

const activeClient = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('pg', () => ({
  Client: vi.fn().mockImplementation(function (this: unknown) {
    return activeClient.current;
  })
}));

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');
  return { ...actual, createPostgresAdapter: vi.fn(() => Promise.resolve({ type: 'PostgreSQL' })) };
});

const makeMockClient = () => ({
  connect: vi.fn(() => Promise.resolve()),
  query: vi.fn<(...args: unknown[]) => Promise<{ rowCount: number; rows: unknown[] }>>(() =>
    Promise.resolve({ rowCount: 0, rows: [] })
  ),
  end: vi.fn(() => Promise.resolve())
});

describe('testPostgresConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when no config is provided', async () => {
    await expect(testPostgresConnection(undefined)).rejects.toThrow('error.connectionFailed');
  });

  it('connects, queries and ends the client on success', async () => {
    const client = makeMockClient();

    activeClient.current = client;

    await testPostgresConnection({
      host: 'localhost',
      port: 5432,
      user: 'u',
      password: 'p',
      database: 'db',
      ssl: false
    });

    expect(client.connect).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith('SELECT 1');
    expect(client.end).toHaveBeenCalled();
  });

  it('throws a mapped error when the connection fails', async () => {
    const client = makeMockClient();
    vi.mocked(client.connect).mockRejectedValue(new Error('ECONNREFUSED'));

    activeClient.current = client;

    await expect(
      testPostgresConnection({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'db', ssl: false })
    ).rejects.toThrow('error.connectionFailed');
    expect(client.end).toHaveBeenCalled();
  });

  it('still resolves when ending the client fails', async () => {
    const client = makeMockClient();
    vi.mocked(client.end).mockRejectedValue(new Error('end failed'));

    activeClient.current = client;

    await expect(
      testPostgresConnection({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'db', ssl: false })
    ).resolves.toBeUndefined();
  });
});

describe('openPostgreSql', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid database names before attempting a connection', async () => {
    await expect(
      openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: '  ', ssl: false })
    ).rejects.toThrow('error.invalidDBName');
    await expect(
      openPostgreSql({
        host: 'localhost',
        port: 5432,
        user: 'u',
        password: 'p',
        database: 'a'.repeat(64),
        ssl: false
      })
    ).rejects.toThrow('error.databaseNameTooLong');
    await expect(
      openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'bad name!', ssl: false })
    ).rejects.toThrow('error.databaseNameInvalid');
  });

  it('creates the database when it does not already exist', async () => {
    const client = makeMockClient();

    activeClient.current = client;

    const result = await openPostgreSql({
      host: 'localhost',
      port: 5432,
      user: 'u',
      password: 'p',
      database: 'my_db',
      ssl: false
    });

    expect(client.query).toHaveBeenCalledWith('CREATE DATABASE "my_db"');
    expect(result.db.type).toBe('PostgreSQL');
  });

  it('does not recreate the database when it already exists', async () => {
    const client = makeMockClient();
    vi.mocked(client.query).mockResolvedValue({ rowCount: 1, rows: [{}] });

    activeClient.current = client;

    await openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'my_db', ssl: false });

    expect(client.query).not.toHaveBeenCalledWith('CREATE DATABASE "my_db"');
  });

  it('throws a mapped error when database creation fails', async () => {
    const client = makeMockClient();
    vi.mocked(client.connect).mockRejectedValue(new Error('boom'));

    activeClient.current = client;

    await expect(
      openPostgreSql({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'my_db', ssl: false })
    ).rejects.toThrow('error.databaseCreationFailed');
  });
});

describe('openSqlLite', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('throws when no path is provided', async () => {
    await expect(openSqlLite({ fullPath: undefined, createIfMissing: true })).rejects.toThrow(
      'error.databasePathInvalid'
    );
  });

  it('creates a new database file, replacing any existing file', async () => {
    const dbPath = path.join(tempDir, 'nested', 'db.sqlite');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, 'old-content');

    const { db } = await openSqlLite({ fullPath: dbPath, createIfMissing: true });
    expect(db.type).toBe('SQLite');
    await db.close();
  });

  it('throws when opening a missing file with createIfMissing false', async () => {
    const dbPath = path.join(tempDir, 'missing.sqlite');
    await expect(openSqlLite({ fullPath: dbPath, createIfMissing: false })).rejects.toThrow(
      'error.databaseFileNotExist'
    );
  });

  it('opens an existing database file without recreating it', async () => {
    const dbPath = path.join(tempDir, 'existing.sqlite');
    const { db: initial } = await openSqlLite({ fullPath: dbPath, createIfMissing: true });
    await initial.close();

    const { db } = await openSqlLite({ fullPath: dbPath, createIfMissing: false });
    expect(db.type).toBe('SQLite');
    await db.close();
  });
});
