import type { Preset } from '@invoice-builder/contracts';
import type { Stored } from './stored';

export type PresetRow = Stored<Preset, 'layoutSchema' | 'styleProfileFieldSortOrders' | 'styleProfilePdfTexts'>;
