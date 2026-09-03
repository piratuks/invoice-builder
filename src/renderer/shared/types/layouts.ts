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
  schema: LayoutSchema;
  invoiceCount: number;
  quotesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutFormData {
  id?: number;
  isArchived: boolean;
  schema: string;
}

export type LayoutAdd = Pick<Layout, 'isArchived' | 'schema'>;
export type LayoutUpdate = Partial<LayoutAdd> & Pick<Layout, 'id'>;

export interface LayoutValidationError {
  path: string;
  message: string;
  params?: Record<string, string>;
}

const MAX_LAYOUT_BYTES = 64 * 1024;
const sectionTypes: LayoutSectionType[] = [
  'watermark',
  'header',
  'itemsTable',
  'financialTotals',
  'paymentInfo',
  'totalsRow',
  'notes',
  'signature',
  'pageCounter'
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const hasOnly = (value: Record<string, unknown>, keys: string[], path: string, errors: LayoutValidationError[]) => {
  Object.keys(value)
    .filter(key => !keys.includes(key))
    .forEach(key =>
      errors.push({ path: `${path}.${key}`, message: 'layouts.validation.unknownProperty', params: { property: key } })
    );
};
const enumValue = (value: unknown, values: string[], path: string, errors: LayoutValidationError[]) => {
  if (value !== undefined && !values.includes(value as string))
    errors.push({
      path,
      message: 'layouts.validation.unsupportedValue',
      params: { value: String(value) }
    });
};
const headerBlockTypes: HeaderBlockType[] = [
  'row',
  'column',
  'title',
  'logo',
  'businessInfo',
  'clientInfo',
  'invoiceMeta',
  'paymentInfo'
];
const totalsRowBlockTypes: TotalsRowBlockType[] = ['paymentInfo', 'financialTotals', 'spacer'];
const validateTotalsBlocks = (value: unknown, path: string, errors: LayoutValidationError[]) => {
  if (!Array.isArray(value)) {
    errors.push({ path, message: 'layouts.validation.totalsArray' });
    return;
  }
  value.forEach((block, index) => {
    const blockPath = `${path}[${index}]`;
    if (!isObject(block)) {
      errors.push({ path: blockPath, message: 'layouts.validation.object' });
      return;
    }
    hasOnly(block, ['type', 'paymentSource'], blockPath, errors);
    if (!totalsRowBlockTypes.includes(block.type as TotalsRowBlockType))
      errors.push({ path: `${blockPath}.type`, message: 'layouts.validation.totalsType' });
    enumValue(block.paymentSource, ['bank', 'legacyBusiness'], `${blockPath}.paymentSource`, errors);
  });
};
const validateHeaderBlocks = (value: unknown, path: string, errors: LayoutValidationError[]) => {
  if (!Array.isArray(value)) {
    errors.push({ path, message: 'layouts.validation.headerArray' });
    return;
  }
  value.forEach((block, index) => {
    const blockPath = `${path}[${index}]`;
    if (!isObject(block)) {
      errors.push({ path: blockPath, message: 'layouts.validation.object' });
      return;
    }
    hasOnly(
      block,
      [
        'type',
        'children',
        'width',
        'align',
        'justify',
        'paddingTop',
        'paddingBottom',
        'gap',
        'boxed',
        'showTitle',
        'showInvoiceLabel',
        'paymentSource'
      ],
      blockPath,
      errors
    );
    if (!headerBlockTypes.includes(block.type as HeaderBlockType))
      errors.push({ path: `${blockPath}.type`, message: 'layouts.validation.headerType' });
    enumValue(block.width, ['20%', '40%', '50%', '60%', '100%'], `${blockPath}.width`, errors);
    enumValue(block.align, ['start', 'center', 'end'], `${blockPath}.align`, errors);
    enumValue(block.justify, ['between'], `${blockPath}.justify`, errors);
    enumValue(block.paymentSource, ['bank', 'legacyBusiness'], `${blockPath}.paymentSource`, errors);
    [block.paddingTop, block.paddingBottom, block.gap].forEach(value => {
      if (value !== undefined && typeof value !== 'number')
        errors.push({ path: blockPath, message: 'layouts.validation.spacing' });
    });
    ['boxed', 'showTitle', 'showInvoiceLabel'].forEach(key => {
      if (block[key] !== undefined && typeof block[key] !== 'boolean')
        errors.push({ path: `${blockPath}.${key}`, message: 'layouts.validation.boolean' });
    });
    if (block.type === 'row' || block.type === 'column')
      validateHeaderBlocks(block.children, `${blockPath}.children`, errors);
    else if (block.children !== undefined)
      errors.push({ path: `${blockPath}.children`, message: 'layouts.validation.children' });
  });
};

export const validateLayoutSchema = (value: unknown): LayoutValidationError[] => {
  const errors: LayoutValidationError[] = [];
  if (!isObject(value)) return [{ path: '$', message: 'layouts.validation.layoutObject' }];
  hasOnly(value, ['schemaVersion', 'meta', 'sections'], '$', errors);
  if (value.schemaVersion !== 1) errors.push({ path: 'schemaVersion', message: 'layouts.validation.version' });
  if (!isObject(value.meta)) errors.push({ path: 'meta', message: 'layouts.validation.requiredObject' });
  else {
    hasOnly(value.meta, ['name', 'description'], 'meta', errors);
    if (typeof value.meta.name !== 'string' || !value.meta.name.trim() || value.meta.name.length > 120)
      errors.push({ path: 'meta.name', message: 'layouts.validation.name' });
    if (value.meta.description !== undefined && typeof value.meta.description !== 'string')
      errors.push({ path: 'meta.description', message: 'layouts.validation.string' });
  }
  if (value.sections !== undefined) {
    if (!Array.isArray(value.sections)) errors.push({ path: 'sections', message: 'layouts.validation.array' });
    else {
      const seen = new Set<string>();
      value.sections.forEach((section, index) => {
        const path = `sections[${index}]`;
        if (!isObject(section)) {
          errors.push({ path, message: 'layouts.validation.object' });
          return;
        }
        hasOnly(section, ['type', 'visible', 'blocks', 'totalsBlocks', 'watermarkOrder', 'columnSizing'], path, errors);
        if (!sectionTypes.includes(section.type as LayoutSectionType))
          errors.push({ path: `${path}.type`, message: 'layouts.validation.sectionType' });
        else if (seen.has(section.type as string))
          errors.push({ path: `${path}.type`, message: 'layouts.validation.duplicate' });
        else seen.add(section.type as string);
        if (section.visible !== true && section.visible !== false && section.visible !== 'auto')
          errors.push({ path: `${path}.visible`, message: 'layouts.validation.visible' });
        if (section.type === 'header' && section.blocks !== undefined)
          validateHeaderBlocks(section.blocks, `${path}.blocks`, errors);
        if (section.type !== 'header' && section.blocks !== undefined)
          errors.push({ path: `${path}.blocks`, message: 'layouts.validation.blocks' });
        if (section.type === 'totalsRow' && section.totalsBlocks !== undefined)
          validateTotalsBlocks(section.totalsBlocks, `${path}.totalsBlocks`, errors);
        if (section.type !== 'totalsRow' && section.totalsBlocks !== undefined)
          errors.push({ path: `${path}.totalsBlocks`, message: 'layouts.validation.totalsBlocks' });
        enumValue(section.watermarkOrder, ['default', 'paidFirst'], `${path}.watermarkOrder`, errors);
        enumValue(section.columnSizing, ['fixedFlex', 'proportional'], `${path}.columnSizing`, errors);
      });
    }
  }
  return errors;
};

export const parseLayoutSchema = (text: string): { schema?: LayoutSchema; errors: LayoutValidationError[] } => {
  if (new TextEncoder().encode(text).byteLength > MAX_LAYOUT_BYTES)
    return { errors: [{ path: '$', message: 'layouts.validation.tooLarge' }] };
  try {
    const value: unknown = JSON.parse(text);
    const errors = validateLayoutSchema(value);
    return errors.length ? { errors } : { schema: value as LayoutSchema, errors };
  } catch {
    return { errors: [{ path: '$', message: 'layouts.validation.invalidJson' }] };
  }
};
