export interface Client {
  id: number;
  name: string;
  shortName: string;
  address?: string;
  email?: string;
  phone?: string;
  code?: string;
  additional?: string;
  vatCode?: string;
  peppolEndpointId?: string;
  countryCode?: string;
  peppolEndpointSchemeId?: string;
  buyerReference?: string;
  invoiceCount: number;
  quotesCount: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  isArchived: boolean;
}

export interface ClientAdd {
  name: string;
  shortName: string;
  address?: string;
  email?: string;
  phone?: string;
  code?: string;
  additional?: string;
  vatCode?: string;
  peppolEndpointId?: string;
  countryCode?: string;
  peppolEndpointSchemeId?: string;
  buyerReference?: string;
  description?: string;
  isArchived: boolean;
}

export interface ClientUpdate extends ClientAdd {
  id: number;
}
