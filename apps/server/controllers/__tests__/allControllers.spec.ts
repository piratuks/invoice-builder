import { initControllers } from '../index';

const registered = vi.hoisted(() => ({
  routes: [] as string[]
}));

const app = {
  get: (path: string) => registered.routes.push(`GET:${path}`),
  post: (path: string) => registered.routes.push(`POST:${path}`),
  put: (path: string) => registered.routes.push(`PUT:${path}`),
  delete: (path: string) => registered.routes.push(`DELETE:${path}`)
};

describe('webserver controller route registration', () => {
  beforeEach(() => {
    registered.routes.length = 0;
  });

  it('registers the complete API route surface', () => {
    initControllers(app as never);

    expect(registered.routes.length).toBeGreaterThan(50);
    expect(registered.routes).toContain('GET:/api/invoices');
    expect(registered.routes).toContain('POST:/api/invoices/duplicate');
    expect(registered.routes).toContain('POST:/api/import');
    expect(registered.routes).toContain('GET:/api/layouts/export/:id');
  });
});
