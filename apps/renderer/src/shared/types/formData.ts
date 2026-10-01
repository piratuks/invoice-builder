import type {
  BankAdd,
  BusinessAdd,
  CategoryAdd,
  ClientAdd,
  CurrencyAdd,
  InvoiceAdd,
  ItemAdd,
  PresetAdd,
  StyleProfileAdd,
  UnitAdd
} from '@invoice-builder/contracts';

export interface BankFromData extends BankAdd {
  id?: number;
}

export interface BusinessFromData extends Omit<BusinessAdd, 'logo'> {
  id?: number;
  logo?: Uint8Array;
}

export interface CategoryFromData extends CategoryAdd {
  id?: number;
}

export interface ClientFromData extends ClientAdd {
  id?: number;
}

export interface CurrencyFromData extends CurrencyAdd {
  id?: number;
}

export interface InvoiceFromData extends InvoiceAdd {
  id?: number;
}

export interface ItemFromData extends ItemAdd {
  id?: number;
}

export interface PresetFromData extends Omit<PresetAdd, 'signatureData'> {
  id?: number;
  businessName?: string;
  clientName?: string;
  currencyCode?: string;
  currencySymbol?: string;
  bankName?: string;
  styleProfileName?: string;
  signatureData?: Uint8Array | null;
}

export interface StyleProfileFromData extends StyleProfileAdd {
  id?: number;
}

export interface UnitFromData extends UnitAdd {
  id?: number;
}
