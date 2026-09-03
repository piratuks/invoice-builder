export type LayoutVisibility = boolean | 'auto';
export type WatermarkOrder = 'default' | 'paidFirst';
export type PaymentSource = 'bank' | 'legacyBusiness';
export type ColumnSizing = 'fixedFlex' | 'proportional';
export type LayoutSectionType =
  | 'watermark'
  | 'header'
  | 'itemsTable'
  | 'financialTotals'
  | 'paymentInfo'
  | 'totalsRow'
  | 'notes'
  | 'signature'
  | 'pageCounter';
export type TotalsRowBlockType = 'paymentInfo' | 'financialTotals' | 'spacer';
export interface TotalsRowBlock {
  type: TotalsRowBlockType;
  paymentSource?: PaymentSource;
}
export type HeaderBlockType =
  'row' | 'column' | 'title' | 'logo' | 'businessInfo' | 'clientInfo' | 'invoiceMeta' | 'paymentInfo';
export interface HeaderBlock {
  type: HeaderBlockType;
  children?: HeaderBlock[];
  width?: '20%' | '40%' | '50%' | '60%' | '100%';
  align?: 'start' | 'center' | 'end';
  justify?: 'between';
  paddingTop?: 10 | 20;
  paddingBottom?: 20;
  gap?: 5 | 10;
  boxed?: boolean;
  showTitle?: boolean;
  showInvoiceLabel?: boolean;
  paymentSource?: PaymentSource;
}

export interface LayoutSchema {
  schemaVersion: 1;
  meta: { name: string; description?: string };
  sections?: Array<{
    type: LayoutSectionType;
    visible: LayoutVisibility;
    blocks?: HeaderBlock[];
    totalsBlocks?: TotalsRowBlock[];
    watermarkOrder?: WatermarkOrder;
    columnSizing?: ColumnSizing;
  }>;
}

export interface Layout {
  id: number;
  isArchived: boolean;
  schema: LayoutSchema | string;
  invoiceCount: number;
  quotesCount: number;
  createdAt: string;
  updatedAt: string;
}
