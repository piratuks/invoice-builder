import { initDatabaseController } from '../database';

const mocks = vi.hoisted(() => ({
  readdir: vi.fn().mockResolvedValue(['one.db', 'two.txt', 'three.sqlite']),
  testPostgresConnection: vi.fn().mockResolvedValue(undefined),
  setupDB: vi.fn().mockResolvedValue(undefined),
  handlers: new Map<string, (req: unknown, res: unknown) => Promise<void>>()
}));

vi.mock('fs/promises', () => ({ default: { readdir: mocks.readdir } }));
vi.mock('../../../shared/db/setup', () => ({ testPostgresConnection: mocks.testPostgresConnection }));
vi.mock('../../database', () => ({ setupDB: mocks.setupDB }));
vi.mock('../../utils/functions', () => ({
  listDbLimiter: (_req: unknown, _res: unknown, next: () => void) => next()
}));

const app = {
  get: (path: string, ...args: unknown[]) => {
    const handler = args.at(-1) as (req: unknown, res: unknown) => Promise<void>;
    mocks.handlers.set(`GET:${path}`, handler);
  },
  post: (path: string, ...args: unknown[]) => {
    const handler = args.at(-1) as (req: unknown, res: unknown) => Promise<void>;
    mocks.handlers.set(`POST:${path}`, handler);
  }
};

const invoke = async (method: string, path: string, request: Record<string, unknown>) => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  await mocks.handlers.get(`${method}:${path}`)?.(request, { json, status });
  return { json, status };
};

describe('webserver database controller', () => {
  beforeEach(() => {
    mocks.handlers.clear();
    mocks.readdir.mockResolvedValue(['one.db', 'two.txt', 'three.sqlite']);
    mocks.testPostgresConnection.mockResolvedValue(undefined);
    mocks.setupDB.mockResolvedValue(undefined);
    initDatabaseController(app as never);
  });

  it('lists databases and tests postgres/sqlite setup', async () => {
    const list = await invoke('GET', '/api/databases', {});
    await invoke('POST', '/api/databases/test', { body: { host: 'localhost' } });
    await invoke('POST', '/api/databases', { body: { fullPath: 'invoice.db', mode: 'create' } });

    expect(list.json).toHaveBeenCalledWith({ success: true, data: ['one.db', 'three.sqlite'] });
    expect(mocks.testPostgresConnection).toHaveBeenCalledWith({ host: 'host.docker.internal' });
    expect(mocks.setupDB).toHaveBeenCalled();
  });

  it('returns HTTP 500 when database operations fail', async () => {
    mocks.readdir.mockRejectedValueOnce(new Error('read failed'));
    const response = await invoke('GET', '/api/databases', {});

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ success: false, message: 'read failed' });
  });
});
