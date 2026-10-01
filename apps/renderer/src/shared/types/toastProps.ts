export interface ToastProps {
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  vertical?: 'top' | 'bottom';
  horizontal?: 'left' | 'center' | 'right';
  variant?: 'filled' | 'outlined' | 'standard';
  autoHideDuration?: number;
  onClose?: () => void;
  offset?: number;
}
