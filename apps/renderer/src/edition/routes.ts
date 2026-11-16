import type { RouteObject } from 'react-router-dom';
import type { EditionRoute } from './contract';

const routePattern = (path: string) =>
  path
    .replace(/^\/+|\/+$/g, '')
    .replace(/:[^/]+/g, ':')
    .replace(/\/+/g, '/');

export const mergeEditionRoutes = (hostRoutes: RouteObject[], editionRoutes: EditionRoute[]): RouteObject[] => {
  const paths = new Set(
    hostRoutes
      .map(route => route.path)
      .filter((path): path is string => typeof path === 'string' && path !== '*')
      .map(routePattern)
  );

  for (const route of editionRoutes) {
    if (typeof route.path !== 'string' || route.path.trim() === '') {
      throw new Error('Edition routes must define a non-empty child route path.');
    }

    const pattern = routePattern(route.path);
    if (!pattern) {
      throw new Error('Edition routes must define a non-empty child route path.');
    }
    if (pattern === '*') {
      throw new Error('Edition routes cannot replace the host fallback route.');
    }
    if (paths.has(pattern)) {
      throw new Error(`Edition route collides with an existing route: "${route.path}".`);
    }
    paths.add(pattern);
  }

  return [...hostRoutes, ...editionRoutes];
};
