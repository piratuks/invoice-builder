import { Router } from 'express';
import { describe, expect, it } from 'vitest';
import { onEditionServerStarted, onEditionServerStopping, registerEditionRoutes } from '../index';

describe('Community server edition contribution', () => {
  it('registers no additional API routes or lifecycle work', async () => {
    const router = Router();

    expect(registerEditionRoutes(router)).toBeUndefined();
    expect(router.stack).toHaveLength(0);
    await expect(onEditionServerStarted()).resolves.toBeUndefined();
    await expect(onEditionServerStopping()).resolves.toBeUndefined();
  });
});
