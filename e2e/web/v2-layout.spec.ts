import { expect, test } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:3013';

test('web mode selects a seeded V2 layout', async ({ page, request }) => {
  const databaseName = `e2e-v2-${Date.now()}.sqlite`;
  const databaseResponse = await request.post(`${apiBaseUrl}/api/databases`, {
    data: { fullPath: databaseName, mode: 'create', dbType: 'SQLite' }
  });
  expect(databaseResponse.ok()).toBe(true);

  const layoutResponse = await request.post(`${apiBaseUrl}/api/layouts`, {
    data: {
      isArchived: false,
      schema: {
        schemaVersion: 2,
        meta: { name: 'E2E V2 Sidebar' },
        regions: [
          {
            id: 'sidebar',
            width: '30%',
            direction: 'column',
            children: [{ type: 'block', block: { type: 'businessInfo' } }]
          },
          {
            id: 'main',
            width: '70%',
            direction: 'column',
            children: [{ type: 'section', section: { type: 'itemsTable', visible: true } }]
          }
        ]
      }
    }
  });
  expect(layoutResponse.ok()).toBe(true);

  await page.goto('/layouts');
  await page.evaluate(database => localStorage.setItem('databases', JSON.stringify([database])), databaseName);
  await page.reload();
  await page.getByText(databaseName, { exact: true }).last().click();
  await expect(page.locator('body')).toContainText('E2E V2 Sidebar');
  await expect(page.locator('body')).not.toContainText('Application error');
});
