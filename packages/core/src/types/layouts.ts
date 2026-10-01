import type { Layout } from '@invoice-builder/contracts';
import type { Stored } from './stored';

export type LayoutRow = Stored<Layout, 'schema'>;
