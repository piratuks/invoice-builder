import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

export type EditionBridgeApi = object;

export type EditionRoute = Pick<RouteObject, 'path' | 'element'>;

export interface EditionNavigationEntry {
  label: string;
  path: string;
  icon: ReactNode;
  groupName?: string;
  groupIcon?: ReactNode;
}

export interface EditionContribution {
  routes: EditionRoute[];
  navigationEntries: EditionNavigationEntry[];
}
