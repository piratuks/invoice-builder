export interface Currency {
  id: number;
  code: string;
  symbol: string;
  text: string;
  format: string;
  createdAt: string;
  updatedAt: string;
  invoiceCount: number;
  quotesCount: number;
  isArchived: boolean;
  subunit: number;
}

export interface CurrencyAdd {
  code: string;
  symbol: string;
  text: string;
  format: string;
  isArchived: boolean;
  subunit: number;
}

export interface CurrencyUpdate extends CurrencyAdd {
  id: number;
}
