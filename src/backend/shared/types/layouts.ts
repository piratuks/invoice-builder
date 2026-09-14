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

export interface LayoutSection {
  type: LayoutSectionType;
  visible: LayoutVisibility;
  blocks?: HeaderBlock[];
  totalsBlocks?: TotalsRowBlock[];
  watermarkOrder?: WatermarkOrder;
  columnSizing?: ColumnSizing;
}

export interface LayoutSchema {
  schemaVersion: 1;
  meta: { name: string; description?: string };
  sections?: LayoutSection[];
}

export type RegionDirection = 'row' | 'column' | 'grid';
export type RegionWidth =
  '20%' | '25%' | '30%' | '35%' | '40%' | '50%' | '60%' | '65%' | '70%' | '75%' | '80%' | '100%';
export type RegionOverflow = 'continue' | 'keepTogether';
export type LayoutNodeType = 'row' | 'column' | 'grid' | 'block' | 'section';
export interface LayoutContainerNode {
  type: 'row' | 'column' | 'grid';
  children: LayoutNode[];
  width?: RegionWidth;
  gap?: 5 | 10;
}
export interface LayoutBlockNode {
  type: 'block';
  block: HeaderBlock;
}
export interface LayoutSectionNode {
  type: 'section';
  section: LayoutSection;
}
export type LayoutNode = LayoutContainerNode | LayoutBlockNode | LayoutSectionNode;
export interface LayoutRegion {
  id: string;
  width: RegionWidth;
  direction: RegionDirection;
  blocks?: HeaderBlock[];
  sections?: LayoutSectionType[];
  children?: LayoutNode[];
  overflow?: RegionOverflow;
}

export interface LayoutSchemaV2 {
  schemaVersion: 2;
  meta: { name: string; description?: string };
  regions: LayoutRegion[];
  orientation?: 'portrait' | 'landscape';
}

export type LayoutSchemaAny = LayoutSchema | LayoutSchemaV2;

export interface Layout {
  id: number;
  isArchived: boolean;
  schema: LayoutSchemaAny | string;
  invoiceCount: number;
  quotesCount: number;
  createdAt: string;
  updatedAt: string;
}
