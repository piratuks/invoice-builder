import { describe, expect, it } from 'vitest';
import { getEditionContribution } from '../index';
import { mergeEditionRoutes } from '../routes';

describe('Community renderer edition contribution', () => {
  it('contributes no routes or navigation/settings entries', () => {
    expect(getEditionContribution()).toEqual({ routes: [], navigationEntries: [] });
  });

  it('keeps host routes and rejects collisions with host or contributed routes', () => {
    const hostRoutes = [{ path: 'settings' }, { path: '*' }];

    expect(mergeEditionRoutes(hostRoutes, [{ path: 'community', element: null }])).toHaveLength(3);
    expect(() => mergeEditionRoutes(hostRoutes, [{ path: '/', element: null }])).toThrow(
      'Edition routes must define a non-empty child route path.'
    );
    expect(() => mergeEditionRoutes(hostRoutes, [{ path: '/settings/', element: null }])).toThrow(
      'Edition route collides with an existing route: "/settings/".'
    );
    expect(() =>
      mergeEditionRoutes(hostRoutes, [
        { path: 'edition/:id', element: null },
        { path: '/edition/:slug/', element: null }
      ])
    ).toThrow('Edition route collides with an existing route: "/edition/:slug/".');
  });
});
