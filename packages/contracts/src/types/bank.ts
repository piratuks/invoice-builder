export interface BankMeta {
  id: number;
  name: string;
  bankName?: string;
  accountNumber?: string;
  swiftCode?: string;
  address?: string;
  branchCode?: string;
  type?: string;
  routingNumber?: string;
  accountHolder?: string;
  sortOrder?: string;
  upiCode?: string;
  qrCodeFileSize?: number;
  qrCodeFileType?: string;
  qrCodeFileName?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  invoiceCount: number;
  quotesCount: number;
}

export interface Bank extends BankMeta {
  qrCode?: Uint8Array;
}

export interface BankWeb extends BankMeta {
  qrCode?: string | null;
}

export interface BankAddMeta {
  name: string;
  bankName?: string;
  accountNumber?: string;
  swiftCode?: string;
  address?: string;
  branchCode?: string;
  type?: string;
  routingNumber?: string;
  accountHolder?: string;
  sortOrder?: string;
  upiCode?: string;
  qrCodeFileSize?: number;
  qrCodeFileType?: string;
  qrCodeFileName?: string;
  isArchived: boolean;
}

export interface BankAdd extends BankAddMeta {
  qrCode?: Uint8Array;
}

export interface BankUpdate extends BankAdd {
  id: number;
}

export interface BankAddWeb extends BankAddMeta {
  qrCode?: string | null;
}

export interface BankUpdateWeb extends BankAddWeb {
  id: number;
}
