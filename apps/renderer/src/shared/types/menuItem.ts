import type { ReactNode } from 'react';

export interface MenuItem {
  text: string;
  icon: ReactNode;
  path?: string;
  isSelected: ((item: MenuItem) => boolean) | boolean;
  isToggle: boolean;
  description?: string;
  checked?: boolean;
  onChange?: (item: MenuItem) => void;
  onClick?: (item: MenuItem) => void;
  minHeight?: number;
}

export interface MenuItemMetadata {
  groupName?: string;
  groupIcon?: ReactNode;
  isOpen?: boolean;
  items: MenuItem[];
}
