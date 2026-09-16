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
  align?: 'start' | 'center' | 'end';
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
  gap?: 5 | 10;
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
  schema: LayoutSchemaAny;
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
export const MAX_LAYOUT_NESTING_DEPTH = 12;
export const MAX_LAYOUT_NODE_COUNT = 500;
export const validLayoutSectionTypes: LayoutSectionType[] = [
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
export const validHeaderBlockTypes: HeaderBlockType[] = [
  'row',
  'column',
  'title',
  'logo',
  'businessInfo',
  'clientInfo',
  'invoiceMeta',
  'paymentInfo'
];
export const validV2ContainerNodeTypes = ['row', 'column', 'grid'] as const;
export const validV2NodeTypes = [...validV2ContainerNodeTypes, 'block', 'section'] as const;
export const validTotalsRowBlockTypes: TotalsRowBlockType[] = ['paymentInfo', 'financialTotals', 'spacer'];
export const validRegionDirections: RegionDirection[] = ['row', 'column', 'grid'];
export const validRegionWidths: RegionWidth[] = [
  '20%',
  '25%',
  '30%',
  '35%',
  '40%',
  '50%',
  '60%',
  '65%',
  '70%',
  '75%',
  '80%',
  '100%'
];
export const validRegionOverflows: RegionOverflow[] = ['continue', 'keepTogether'];
export const validHeaderBlockWidths: NonNullable<HeaderBlock['width']>[] = ['20%', '40%', '50%', '60%', '100%'];
export const validHeaderBlockAlignments: NonNullable<HeaderBlock['align']>[] = ['start', 'center', 'end'];
export const validHeaderBlockGaps: NonNullable<HeaderBlock['gap']>[] = [5, 10];
export const validHeaderBlockPaddingTops: NonNullable<HeaderBlock['paddingTop']>[] = [10, 20];
export const validHeaderBlockPaddingBottoms: NonNullable<HeaderBlock['paddingBottom']>[] = [20];
export const validHeaderBlockJustifications: NonNullable<HeaderBlock['justify']>[] = ['between'];
export const validHeaderBooleanProperties = ['boxed', 'showTitle', 'showInvoiceLabel'] as const;
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const hasOnly = (value: Record<string, unknown>, keys: string[], path: string, errors: LayoutValidationError[]) =>
  Object.keys(value)
    .filter(key => !keys.includes(key))
    .forEach(key =>
      errors.push({ path: `${path}.${key}`, message: 'layouts.validation.unknownProperty', params: { property: key } })
    );
const enumValue = (value: unknown, values: string[], path: string, errors: LayoutValidationError[]) => {
  if (value !== undefined && !values.includes(value as string))
    errors.push({ path, message: 'layouts.validation.unsupportedValue', params: { value: String(value) } });
};
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
    if (!validTotalsRowBlockTypes.includes(block.type as TotalsRowBlockType))
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
    if (!validHeaderBlockTypes.includes(block.type as HeaderBlockType))
      errors.push({ path: `${blockPath}.type`, message: 'layouts.validation.headerType' });
    enumValue(block.width, ['20%', '40%', '50%', '60%', '100%'], `${blockPath}.width`, errors);
    enumValue(block.align, ['start', 'center', 'end'], `${blockPath}.align`, errors);
    enumValue(block.justify, ['between'], `${blockPath}.justify`, errors);
    enumValue(block.paymentSource, ['bank', 'legacyBusiness'], `${blockPath}.paymentSource`, errors);
    [block.paddingTop, block.paddingBottom, block.gap].forEach(item => {
      if (item !== undefined && typeof item !== 'number')
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
        hasOnly(
          section,
          ['type', 'visible', 'align', 'blocks', 'totalsBlocks', 'watermarkOrder', 'columnSizing'],
          path,
          errors
        );
        if (!validLayoutSectionTypes.includes(section.type as LayoutSectionType))
          errors.push({ path: `${path}.type`, message: 'layouts.validation.sectionType' });
        else if (seen.has(section.type as string))
          errors.push({ path: `${path}.type`, message: 'layouts.validation.duplicate' });
        else seen.add(section.type as string);
        if (section.visible !== true && section.visible !== false && section.visible !== 'auto')
          errors.push({ path: `${path}.visible`, message: 'layouts.validation.visible' });
        enumValue(section.align, ['start', 'center', 'end'], `${path}.align`, errors);
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
const regionDirections = validRegionDirections;
const regionWidths = validRegionWidths;
const validateV2Section = (
  value: unknown,
  path: string,
  seenSections: Set<string>,
  errors: LayoutValidationError[]
) => {
  if (!isObject(value)) {
    errors.push({ path, message: 'layouts.validation.object' });
    return;
  }
  hasOnly(
    value,
    ['type', 'visible', 'align', 'blocks', 'totalsBlocks', 'watermarkOrder', 'columnSizing'],
    path,
    errors
  );
  if (!validLayoutSectionTypes.includes(value.type as LayoutSectionType))
    errors.push({ path: `${path}.type`, message: 'layouts.validation.sectionType' });
  else if (seenSections.has(value.type as string))
    errors.push({ path: `${path}.type`, message: 'layouts.validation.duplicate' });
  else seenSections.add(value.type as string);
  if (value.visible !== true && value.visible !== false && value.visible !== 'auto')
    errors.push({ path: `${path}.visible`, message: 'layouts.validation.visible' });
  enumValue(value.align, ['start', 'center', 'end'], `${path}.align`, errors);
  if (value.type === 'header' && value.blocks !== undefined)
    validateHeaderBlocks(value.blocks, `${path}.blocks`, errors);
  if (value.type !== 'header' && value.blocks !== undefined)
    errors.push({ path: `${path}.blocks`, message: 'layouts.validation.blocks' });
  if (value.type === 'totalsRow' && value.totalsBlocks !== undefined)
    validateTotalsBlocks(value.totalsBlocks, `${path}.totalsBlocks`, errors);
  if (value.type !== 'totalsRow' && value.totalsBlocks !== undefined)
    errors.push({ path: `${path}.totalsBlocks`, message: 'layouts.validation.totalsBlocks' });
  enumValue(value.watermarkOrder, ['default', 'paidFirst'], `${path}.watermarkOrder`, errors);
  enumValue(value.columnSizing, ['fixedFlex', 'proportional'], `${path}.columnSizing`, errors);
};
const validateLayoutNodes = (
  value: unknown,
  path: string,
  seenSections: Set<string>,
  errors: LayoutValidationError[],
  depth: number,
  nodeCount: { value: number; reported: boolean }
) => {
  if (!Array.isArray(value)) {
    errors.push({ path, message: 'layouts.validation.array' });
    return;
  }
  if (depth > MAX_LAYOUT_NESTING_DEPTH) {
    errors.push({ path, message: 'layouts.validation.nesting' });
    return;
  }
  value.forEach((node, index) => {
    const nodePath = `${path}[${index}]`;
    if (!isObject(node)) {
      errors.push({ path: nodePath, message: 'layouts.validation.object' });
      return;
    }
    nodeCount.value += 1;
    if (nodeCount.value > MAX_LAYOUT_NODE_COUNT && !nodeCount.reported) {
      errors.push({ path, message: 'layouts.validation.nodeCount' });
      nodeCount.reported = true;
    }
    hasOnly(node, ['type', 'children', 'block', 'section', 'width', 'gap'], nodePath, errors);
    if (node.type === 'row' || node.type === 'column' || node.type === 'grid') {
      enumValue(node.width, regionWidths, `${nodePath}.width`, errors);
      if (node.gap !== undefined && node.gap !== 5 && node.gap !== 10)
        errors.push({ path: `${nodePath}.gap`, message: 'layouts.validation.spacing' });
      validateLayoutNodes(node.children, `${nodePath}.children`, seenSections, errors, depth + 1, nodeCount);
    } else if (node.type === 'block') {
      if (!isObject(node.block)) errors.push({ path: `${nodePath}.block`, message: 'layouts.validation.object' });
      else validateHeaderBlocks([node.block], `${nodePath}.block`, errors);
    } else if (node.type === 'section') validateV2Section(node.section, `${nodePath}.section`, seenSections, errors);
    else errors.push({ path: `${nodePath}.type`, message: 'layouts.validation.nodeType' });
  });
};
export const validateLayoutSchemaV2 = (value: unknown): LayoutValidationError[] => {
  const errors: LayoutValidationError[] = [];
  if (!isObject(value)) return [{ path: '$', message: 'layouts.validation.layoutObject' }];
  hasOnly(value, ['schemaVersion', 'meta', 'regions', 'orientation'], '$', errors);
  if (value.schemaVersion !== 2) errors.push({ path: 'schemaVersion', message: 'layouts.validation.version' });
  if (!isObject(value.meta)) errors.push({ path: 'meta', message: 'layouts.validation.requiredObject' });
  else {
    hasOnly(value.meta, ['name', 'description'], 'meta', errors);
    if (typeof value.meta.name !== 'string' || !value.meta.name.trim() || value.meta.name.length > 120)
      errors.push({ path: 'meta.name', message: 'layouts.validation.name' });
    if (value.meta.description !== undefined && typeof value.meta.description !== 'string')
      errors.push({ path: 'meta.description', message: 'layouts.validation.string' });
  }
  if (!Array.isArray(value.regions)) {
    errors.push({ path: 'regions', message: 'layouts.validation.array' });
    return errors;
  }
  enumValue(value.orientation, ['portrait', 'landscape'], 'orientation', errors);
  const seenRegionIds = new Set<string>();
  const seenSections = new Set<string>();
  const nodeCount = { value: 0, reported: false };
  let totalWidth = 0;
  value.regions.forEach((region, index) => {
    const path = `regions[${index}]`;
    if (!isObject(region)) {
      errors.push({ path, message: 'layouts.validation.object' });
      return;
    }
    hasOnly(region, ['id', 'width', 'direction', 'gap', 'blocks', 'sections', 'children', 'overflow'], path, errors);
    if (typeof region.id !== 'string' || !region.id.trim())
      errors.push({ path: `${path}.id`, message: 'layouts.validation.regionId' });
    else if (seenRegionIds.has(region.id)) errors.push({ path: `${path}.id`, message: 'layouts.validation.duplicate' });
    else seenRegionIds.add(region.id);
    if (typeof region.width !== 'string' || !regionWidths.includes(region.width as RegionWidth))
      errors.push({ path: `${path}.width`, message: 'layouts.validation.regionWidth' });
    else totalWidth += Number.parseInt(region.width, 10);
    if (typeof region.direction !== 'string' || !regionDirections.includes(region.direction as RegionDirection))
      errors.push({ path: `${path}.direction`, message: 'layouts.validation.regionDirection' });
    if (region.gap !== undefined && region.gap !== 5 && region.gap !== 10)
      errors.push({ path: `${path}.gap`, message: 'layouts.validation.spacing' });
    enumValue(region.overflow, ['continue', 'keepTogether'], `${path}.overflow`, errors);
    const contentKinds = [
      region.blocks !== undefined,
      region.sections !== undefined,
      region.children !== undefined
    ].filter(Boolean).length;
    if (contentKinds > 1 || contentKinds === 0) errors.push({ path, message: 'layouts.validation.regionContent' });
    if (region.blocks !== undefined) validateHeaderBlocks(region.blocks, `${path}.blocks`, errors);
    if (region.sections !== undefined) {
      if (!Array.isArray(region.sections))
        errors.push({ path: `${path}.sections`, message: 'layouts.validation.array' });
      else
        region.sections.forEach((sectionType, sectionIndex) => {
          const sectionPath = `${path}.sections[${sectionIndex}]`;
          if (!validLayoutSectionTypes.includes(sectionType as LayoutSectionType))
            errors.push({ path: sectionPath, message: 'layouts.validation.sectionType' });
          else if (seenSections.has(sectionType as string))
            errors.push({ path: sectionPath, message: 'layouts.validation.duplicate' });
          else seenSections.add(sectionType as string);
        });
    }
    if (region.children !== undefined)
      validateLayoutNodes(region.children, `${path}.children`, seenSections, errors, 0, nodeCount);
  });
  if (totalWidth > 100) errors.push({ path: 'regions', message: 'layouts.validation.regionWidthsTotal' });
  return errors;
};
export const parseLayoutSchema = (text: string): { schema?: LayoutSchemaAny; errors: LayoutValidationError[] } => {
  if (new TextEncoder().encode(text).byteLength > MAX_LAYOUT_BYTES)
    return { errors: [{ path: '$', message: 'layouts.validation.tooLarge' }] };
  try {
    const value: unknown = JSON.parse(text);
    if (!isObject(value)) return { errors: [{ path: '$', message: 'layouts.validation.layoutObject' }] };
    const errors = value.schemaVersion === 2 ? validateLayoutSchemaV2(value) : validateLayoutSchema(value);
    return errors.length ? { errors } : { schema: value as unknown as LayoutSchemaAny, errors };
  } catch {
    return { errors: [{ path: '$', message: 'layouts.validation.invalidJson' }] };
  }
};
