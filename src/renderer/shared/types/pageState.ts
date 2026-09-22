import type { Settings } from './settings';
import type { ToastMeta } from './toastMeta';

export interface PageState {
  isLoading: boolean;
  loadingCount: number;
  loadingCursorCount: number;
  dbReady: boolean;
  toasts: ToastMeta[];
  settings?: Settings;
  clientSnapshotOptions?: Array<{ label: string; value: string }>;
  businessSnapshotOptions?: Array<{ label: string; value: string }>;
  version?: string;
  newVersion?: string;
  updateMessage?: string;
  isAllowedToLeave: boolean;
}
