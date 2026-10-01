export interface Unit {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  invoiceCount: number;
  quotesCount: number;
  isArchived: boolean;
}

export interface UnitAdd {
  name: string;
  isArchived: boolean;
}

export interface UnitUpdate extends UnitAdd {
  id: number;
}
