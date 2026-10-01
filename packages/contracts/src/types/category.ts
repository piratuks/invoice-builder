export interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  invoiceCount: number;
  quotesCount: number;
  isArchived: boolean;
}

export interface CategoryAdd {
  name: string;
  isArchived: boolean;
}

export interface CategoryUpdate extends CategoryAdd {
  id: number;
}
