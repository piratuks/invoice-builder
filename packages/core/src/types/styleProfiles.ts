import type { StyleProfile } from '@invoice-builder/contracts';
import type { Stored } from './stored';

export type StyleProfileRow = Stored<StyleProfile, 'fieldSortOrders' | 'pdfTexts'>;
