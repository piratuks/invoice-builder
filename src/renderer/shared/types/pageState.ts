import type { Settings } from './settings';
import type { ToastMeta } from './toastMeta';

export interface PageState {
  isLoading: boolean;
  toasts: ToastMeta[];
  settings?: Settings;
  categoryOptions?: Array<{ label: string; value: number }>;
  unitOptions?: Array<{ label: string; value: number }>;
  clientSnapshotOptions?: Array<{ label: string; value: string }>;
  businessSnapshotOptions?: Array<{ label: string; value: string }>;
  version?: string;
  newVersion?: string;
  updateMessage?: string;
  isAllowedToLeave: boolean;
}
