import { _electron as electron, expect, test } from '@playwright/test';

test('Electron mode launches the application shell', async () => {
  const app = await electron.launch({ args: ['dist-be/backend/main/main.cjs'] });
  try {
    await expect
      .poll(() => app.windows().some(window => !window.url().startsWith('devtools://')), { timeout: 15_000 })
      .toBe(true);
  } finally {
    await app.close();
  }
});
