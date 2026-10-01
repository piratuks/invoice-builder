export interface Item {
  id: number;
  name: string;
  amount?: string;
  unitId?: number;
  categoryId?: number;
  unitName?: string;
  categoryName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  invoiceCount: number;
  quotesCount: number;
  isArchived: boolean;
}

export interface ItemAdd {
  name: string;
  amount?: string;
  unitId?: number;
  categoryId?: number;
  description?: string;
  categoryName?: string;
  unitName?: string;
  isArchived: boolean;
}

export interface ItemUpdate extends ItemAdd {
  id: number;
}
