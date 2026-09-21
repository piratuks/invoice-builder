import { DatabaseType } from '../../enums/databaseType';
import { createPostgresAdapter, createSqliteAdapter } from '../client';

const activePool = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(function (this: unknown) {
    return activePool.current;
  })
}));

describe('createPostgresAdapter', () => {
  const makeMockPool = () => {
    const client = {
      query: vi.fn<(...args: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>>(() =>
        Promise.resolve({ rows: [], rowCount: 0 })
      ),
      release: vi.fn()
    };
    const pool = {
      connect: vi.fn(() => Promise.resolve(client)),
      query: vi.fn<(...args: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>>(() =>
        Promise.resolve({ rows: [], rowCount: 0 })
      ),
      end: vi.fn(() => Promise.resolve())
    };
    return { client, pool };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports the postgre database type', () => {
    const { pool } = makeMockPool();

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');
    expect(adapter.type).toBe(DatabaseType.postgre);
  });

  it('runs an insert with RETURNING id and converts boolean params', async () => {
    const { pool } = makeMockPool();
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ id: 42 }], rowCount: 1 });

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    const id = await adapter.run('INSERT INTO t ("a") VALUES (?)', [true], true);
    expect(id).toBe(42);
    expect(pool.query).toHaveBeenCalledWith('INSERT INTO t ("a") VALUES ($1) RETURNING id', [1]);
  });

  it('does not append RETURNING id when already present', async () => {
    const { pool } = makeMockPool();
    vi.mocked(pool.query).mockResolvedValue({ rows: [{ id: 7 }], rowCount: 1 });

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    await adapter.run('INSERT INTO t ("a") VALUES (?) RETURNING id', ['x'], true);
    expect(pool.query).toHaveBeenCalledWith('INSERT INTO t ("a") VALUES ($1) RETURNING id', ['x']);
  });

  it('runs an update and returns the row count', async () => {
    const { pool } = makeMockPool();
    vi.mocked(pool.query).mockResolvedValue({ rows: [], rowCount: 3 });

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    const count = await adapter.run('UPDATE t SET "a" = ? WHERE "id" = ?', [false, 1]);
    expect(count).toBe(3);
    expect(pool.query).toHaveBeenCalledWith('UPDATE t SET "a" = $1 WHERE "id" = $2', [0, 1]);
  });

  it('acquires a dedicated client for BEGIN and runs subsequent statements on it until COMMIT', async () => {
    const { pool, client } = makeMockPool();

    activePool.current = pool;
    vi.mocked(client.query).mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
    const adapter = createPostgresAdapter('postgres://localhost/db');

    await adapter.run('BEGIN');
    expect(pool.connect).toHaveBeenCalledTimes(1);

    await adapter.get('SELECT * FROM t WHERE id = ?', [1]);
    expect(client.query).toHaveBeenCalledWith('SELECT * FROM t WHERE id = $1', [1]);
    expect(pool.query).not.toHaveBeenCalled();

    await adapter.run('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back and releases the client', async () => {
    const { pool, client } = makeMockPool();
    vi.mocked(client.query).mockResolvedValue({ rows: [], rowCount: 0 });

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    await adapter.run('BEGIN');
    await adapter.run('ROLLBACK');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when COMMIT/ROLLBACK is run without an active transaction', async () => {
    const { pool } = makeMockPool();

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    const result = await adapter.run('COMMIT');
    expect(result).toBe(0);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('throws a mapped error when releasing the client fails', async () => {
    const { pool, client } = makeMockPool();
    vi.mocked(client.release).mockImplementation(() => {
      throw new Error('release failed');
    });

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    await adapter.run('BEGIN');
    await expect(adapter.run('COMMIT')).rejects.toThrow('error.failedPGrelease');
  });

  it('converts boolean and date fields on get/all/query results', async () => {
    const { pool } = makeMockPool();
    const createdAt = new Date('2024-01-15T10:00:00.000Z');
    vi.mocked(pool.query).mockResolvedValue({
      rows: [{ id: 1, isArchived: true, createdAt }],
      rowCount: 1
    });

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    const row = await adapter.get<{ isArchived: boolean; createdAt: string }>('SELECT * FROM t');
    expect(row?.isArchived).toBe(true);
    expect(row?.createdAt).toBe('2024-01-15 10:00:00.000');

    const rows = await adapter.all('SELECT * FROM t');
    expect(rows).toHaveLength(1);

    const queried = await adapter.query('SELECT * FROM t');
    expect(queried.rows).toHaveLength(1);
  });

  it('returns null from get when there are no matching rows', async () => {
    const { pool } = makeMockPool();
    vi.mocked(pool.query).mockResolvedValue({ rows: [], rowCount: 0 });

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    expect(await adapter.get('SELECT * FROM t')).toBeNull();
  });

  it('releases any active client and ends the pool on close', async () => {
    const { pool, client } = makeMockPool();

    activePool.current = pool;
    const adapter = createPostgresAdapter('postgres://localhost/db');

    await adapter.run('BEGIN');
    await adapter.close();

    expect(client.release).toHaveBeenCalledTimes(1);
    expect(pool.end).toHaveBeenCalledTimes(1);
  });
});

describe('createSqliteAdapter error propagation', () => {
  it('rejects when the underlying sqlite calls fail', async () => {
    const failingDb = {
      run: (_sql: string, _params: unknown[], cb: (err: Error) => void) => cb(new Error('run failed')),
      get: (_sql: string, _params: unknown[], cb: (err: Error) => void) => cb(new Error('get failed')),
      all: (_sql: string, _params: unknown[], cb: (err: Error) => void) => cb(new Error('all failed')),
      close: (cb: (err: Error) => void) => cb(new Error('close failed'))
    };
    const adapter = createSqliteAdapter(failingDb as never);

    await expect(adapter.run('SELECT 1')).rejects.toThrow('run failed');
    await expect(adapter.get('SELECT 1')).rejects.toThrow('get failed');
    await expect(adapter.all('SELECT 1')).rejects.toThrow('all failed');
    await expect(adapter.query('SELECT 1')).rejects.toThrow('all failed');
    await expect(adapter.close()).rejects.toThrow('close failed');
  });
});
