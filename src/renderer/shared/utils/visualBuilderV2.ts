import {
  type HeaderBlock,
  type LayoutNode,
  type LayoutRegion,
  type LayoutSchema,
  type LayoutSchemaV2,
  type LayoutSectionType,
  MAX_LAYOUT_NESTING_DEPTH,
  MAX_LAYOUT_NODE_COUNT,
  validRegionDirections,
  validRegionOverflows,
  validRegionWidths
} from '../types/layouts';

export interface LayoutBuilderV2Node {
  id: string;
  type: 'node';
  node: LayoutNode;
  children: LayoutBuilderV2Node[];
}
export interface LayoutBuilderV2Region {
  id: string;
  type: 'region';
  region: LayoutRegion;
  children: LayoutBuilderV2Node[];
}
export interface LayoutBuilderV2State {
  schemaVersion: 2;
  meta: LayoutSchemaV2['meta'];
  orientation?: LayoutSchemaV2['orientation'];
  regions: LayoutBuilderV2Region[];
}
export type LayoutBuilderV2AddNodeType =
  | 'row'
  | 'column'
  | 'grid'
  | 'section'
  | 'title'
  | 'logo'
  | 'businessInfo'
  | 'clientInfo'
  | 'invoiceMeta'
  | 'paymentInfo';

export const supportedRegionDirections = validRegionDirections;
export const supportedRegionWidths = validRegionWidths;
export const supportedRegionOverflows = validRegionOverflows;

const v2NodeId = (regionId: string, path: number[]) => `layout-node-${regionId}-${path.join('-')}`;
const isV2StructuralContainer = (node: LayoutNode): node is Extract<LayoutNode, { type: 'row' | 'column' | 'grid' }> =>
  node.type === 'row' || node.type === 'column' || node.type === 'grid';
const isV2HeaderBlockContainer = (
  node: LayoutNode
): node is { type: 'block'; block: HeaderBlock & { type: 'row' | 'column' } } =>
  node.type === 'block' && (node.block.type === 'row' || node.block.type === 'column');
export const canContainLayoutBuilderV2Node = (parent: LayoutNode, child: LayoutNode): boolean =>
  isV2StructuralContainer(parent)
    ? true
    : (parent.type === 'section' && parent.section.type === 'header') || isV2HeaderBlockContainer(parent)
      ? child.type === 'block'
      : false;
const buildV2Node = (node: LayoutNode, regionId: string, path: number[]): LayoutBuilderV2Node => ({
  id: v2NodeId(regionId, path),
  type: 'node',
  node: { ...node },
  children: isV2StructuralContainer(node)
    ? node.children.map((child, index) => buildV2Node(child, regionId, [...path, index]))
    : node.type === 'section' && node.section.type === 'header'
      ? (node.section.blocks ?? []).map((block, index) =>
          buildV2Node({ type: 'block', block }, regionId, [...path, index])
        )
      : isV2HeaderBlockContainer(node)
        ? (node.block.children ?? []).map((child, index) =>
            buildV2Node({ type: 'block', block: child }, regionId, [...path, index])
          )
        : []
});
const serializeV2Node = (builderNode: LayoutBuilderV2Node): LayoutNode => {
  if (isV2StructuralContainer(builderNode.node))
    return { ...builderNode.node, children: builderNode.children.map(serializeV2Node) };
  if (builderNode.node.type === 'section' && builderNode.node.section.type === 'header')
    return {
      ...builderNode.node,
      section: {
        ...builderNode.node.section,
        blocks: builderNode.children
          .map(serializeV2Node)
          .filter((child): child is Extract<LayoutNode, { type: 'block' }> => child.type === 'block')
          .map(child => child.block)
      }
    };
  if (isV2HeaderBlockContainer(builderNode.node))
    return {
      ...builderNode.node,
      block: {
        ...builderNode.node.block,
        children: builderNode.children
          .map(serializeV2Node)
          .filter((child): child is Extract<LayoutNode, { type: 'block' }> => child.type === 'block')
          .map(child => child.block)
      }
    };
  return { ...builderNode.node };
};
const regionContent = (region: LayoutRegion): LayoutBuilderV2Node[] =>
  region.children
    ? region.children.map((node, index) => buildV2Node(node, region.id, [index]))
    : region.blocks
      ? region.blocks.map((block, index) => buildV2Node({ type: 'block', block }, region.id, [index]))
      : (region.sections ?? []).map((section, index) =>
          buildV2Node({ type: 'section', section: { type: section, visible: true } }, region.id, [index])
        );
export const createLayoutBuilderV2State = (layout: LayoutSchemaV2): LayoutBuilderV2State => ({
  schemaVersion: 2,
  meta: { ...layout.meta },
  orientation: layout.orientation,
  regions: layout.regions.map(region => ({
    id: region.id,
    type: 'region',
    region: { ...region },
    children: regionContent(region)
  }))
});
export const serializeLayoutBuilderV2State = (builderState: LayoutBuilderV2State): LayoutSchemaV2 => ({
  schemaVersion: 2,
  meta: { ...builderState.meta },
  ...(builderState.orientation ? { orientation: builderState.orientation } : {}),
  regions: builderState.regions.map(({ children, region }) => {
    const content = children.map(serializeV2Node);
    const sourceKind = region.children ? 'children' : region.blocks ? 'blocks' : 'sections';
    const regionBase = { ...region };
    delete regionBase.blocks;
    delete regionBase.sections;
    delete regionBase.children;
    return {
      ...regionBase,
      ...(sourceKind === 'children'
        ? { children: content }
        : sourceKind === 'blocks'
          ? { blocks: content.flatMap(node => (node.type === 'block' ? [node.block] : [])) }
          : { sections: content.flatMap(node => (node.type === 'section' ? [node.section.type] : [])) })
    };
  })
});
const findV2Node = (state: LayoutBuilderV2State, id: string) => {
  const visit = (
    nodes: LayoutBuilderV2Node[],
    parent: LayoutBuilderV2Node[] | undefined
  ): { node: LayoutBuilderV2Node; parent: LayoutBuilderV2Node[]; index: number } | undefined => {
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (node.id === id) return { node, parent: parent ?? nodes, index };
      const nested = visit(node.children, node.children);
      if (nested) return nested;
    }
    return undefined;
  };
  for (const region of state.regions) {
    if (region.id === id) return { node: region, parent: state.regions, index: state.regions.indexOf(region) };
    const result = visit(region.children, region.children);
    if (result) return result;
  }
  return undefined;
};
const findV2ParentContainer = (state: LayoutBuilderV2State, id: string): LayoutNode | undefined => {
  const visit = (nodes: LayoutBuilderV2Node[]): LayoutNode | undefined => {
    for (const node of nodes) {
      if (node.children.some(child => child.id === id)) return node.node;
      const nested = visit(node.children);
      if (nested) return nested;
    }
    return undefined;
  };
  for (const region of state.regions) {
    const parent = visit(region.children);
    if (parent) return parent;
  }
  return undefined;
};
const getNextV2NodeId = (state: LayoutBuilderV2State, regionId: string): string => {
  const ids = new Set<string>();
  const collect = (nodes: LayoutBuilderV2Node[]) =>
    nodes.forEach(node => {
      ids.add(node.id);
      collect(node.children);
    });
  state.regions.forEach(region => collect(region.children));
  let index = 1;
  let id = `new-${regionId}-${index}`;
  while (ids.has(id)) {
    index += 1;
    id = `new-${regionId}-${index}`;
  }
  return id;
};
const countV2Nodes = (state: LayoutBuilderV2State): number => {
  const count = (nodes: LayoutBuilderV2Node[]): number =>
    nodes.reduce((total, node) => total + 1 + count(node.children), 0);
  return state.regions.reduce((total, region) => total + count(region.children), 0);
};
const findV2NodeDepth = (state: LayoutBuilderV2State, id: string): number | undefined => {
  const visit = (nodes: LayoutBuilderV2Node[], depth: number): number | undefined => {
    for (const node of nodes) {
      if (node.id === id) return depth;
      const nested = visit(node.children, depth + 1);
      if (nested !== undefined) return nested;
    }
    return undefined;
  };
  return state.regions.reduce<number | undefined>((result, region) => result ?? visit(region.children, 0), undefined);
};
const getV2SubtreeHeight = (node: LayoutBuilderV2Node): number =>
  node.children.length ? 1 + Math.max(...node.children.map(getV2SubtreeHeight)) : 0;
export const canAddLayoutBuilderV2Node = (layout: LayoutSchemaV2, parentId?: string): boolean => {
  const state = createLayoutBuilderV2State(layout);
  if (countV2Nodes(state) >= MAX_LAYOUT_NODE_COUNT) return false;
  if (!parentId) return true;
  const parentDepth = findV2NodeDepth(state, parentId);
  return parentDepth !== undefined && parentDepth < MAX_LAYOUT_NESTING_DEPTH;
};
export const canReparentLayoutBuilderV2Node = (layout: LayoutSchemaV2, fromId: string, targetId: string): boolean => {
  const state = createLayoutBuilderV2State(layout);
  const from = findV2Node(state, fromId);
  const targetDepth = findV2NodeDepth(state, targetId);
  return (
    !!from &&
    from.node.type === 'node' &&
    targetDepth !== undefined &&
    targetDepth + 1 + getV2SubtreeHeight(from.node) <= MAX_LAYOUT_NESTING_DEPTH
  );
};
export const canReparentLayoutBuilderV2NodeToRegion = (layout: LayoutSchemaV2, fromId: string): boolean => {
  const state = createLayoutBuilderV2State(layout);
  const from = findV2Node(state, fromId);
  return !!from && from.node.type === 'node' && getV2SubtreeHeight(from.node) <= MAX_LAYOUT_NESTING_DEPTH;
};
export const setLayoutBuilderV2Orientation = (
  layout: LayoutSchemaV2,
  orientation: LayoutSchemaV2['orientation']
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  state.orientation = orientation;
  return serializeLayoutBuilderV2State(state);
};
export const updateLayoutBuilderV2Region = (
  layout: LayoutSchemaV2,
  regionId: string,
  update: Partial<Pick<LayoutRegion, 'width' | 'direction' | 'gap' | 'overflow'>>
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const region = state.regions.find(item => item.id === regionId);
  if (region) {
    const nextWidth = update.width ? Number.parseInt(update.width, 10) : Number.parseInt(region.region.width, 10);
    const otherWidth = state.regions
      .filter(item => item.id !== regionId)
      .reduce((total, item) => total + Number.parseInt(item.region.width, 10), 0);
    region.region =
      otherWidth + nextWidth <= 100
        ? { ...region.region, ...update }
        : { ...region.region, ...update, width: region.region.width };
  }
  return serializeLayoutBuilderV2State(state);
};
export const addLayoutBuilderV2Region = (layout: LayoutSchemaV2): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  let suffix = 1;
  let id = `region-${suffix}`;
  while (state.regions.some(region => region.id === id)) {
    suffix += 1;
    id = `region-${suffix}`;
  }
  const usedWidth = state.regions.reduce((total, region) => total + Number.parseInt(region.region.width, 10), 0);
  let width = supportedRegionWidths.filter(value => Number.parseInt(value, 10) <= 100 - usedWidth).at(-1);
  if (!width && state.regions.length > 0) {
    const largestRegion = state.regions.reduce((largest, region) =>
      Number.parseInt(region.region.width, 10) > Number.parseInt(largest.region.width, 10) ? region : largest
    );
    width = '20%';
    const availableLargestWidths = supportedRegionWidths.filter(
      value =>
        Number.parseInt(value, 10) >= 20 &&
        Number.parseInt(value, 10) <= Number.parseInt(largestRegion.region.width, 10) - 20
    );
    const replacementWidth = availableLargestWidths.at(-1);
    if (!replacementWidth) return serializeLayoutBuilderV2State(state);
    largestRegion.region = { ...largestRegion.region, width: replacementWidth };
  }
  if (!width) return serializeLayoutBuilderV2State(state);
  state.regions.push({ id, type: 'region', region: { id, width, direction: 'column', children: [] }, children: [] });
  return serializeLayoutBuilderV2State(state);
};
export const canAddLayoutBuilderV2Region = (layout: LayoutSchemaV2): boolean => {
  const state = createLayoutBuilderV2State(layout);
  const usedWidth = state.regions.reduce((total, region) => total + Number.parseInt(region.region.width, 10), 0);
  if (supportedRegionWidths.some(value => Number.parseInt(value, 10) <= 100 - usedWidth)) return true;
  if (state.regions.length === 0) return true;
  const largestRegion = state.regions.reduce((largest, region) =>
    Number.parseInt(region.region.width, 10) > Number.parseInt(largest.region.width, 10) ? region : largest
  );
  return supportedRegionWidths.some(
    value =>
      Number.parseInt(value, 10) >= 20 &&
      Number.parseInt(value, 10) <= Number.parseInt(largestRegion.region.width, 10) - 20
  );
};
export const removeLayoutBuilderV2Region = (layout: LayoutSchemaV2, regionId: string): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  state.regions = state.regions.filter(region => region.id !== regionId);
  return serializeLayoutBuilderV2State(state);
};
export const renameLayoutBuilderV2Region = (
  layout: LayoutSchemaV2,
  regionId: string,
  nextId: string
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const trimmedId = nextId.trim();
  const region = state.regions.find(item => item.id === regionId);
  if (!region || !trimmedId || state.regions.some(item => item.id === trimmedId && item.id !== regionId))
    return serializeLayoutBuilderV2State(state);
  region.id = trimmedId;
  region.region = { ...region.region, id: trimmedId };
  return serializeLayoutBuilderV2State(state);
};
export const moveLayoutBuilderV2Region = (
  layout: LayoutSchemaV2,
  fromIndex: number,
  toIndex: number
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  if (fromIndex >= 0 && fromIndex < state.regions.length && toIndex >= 0 && toIndex < state.regions.length) {
    const [region] = state.regions.splice(fromIndex, 1);
    state.regions.splice(toIndex, 0, region);
  }
  return serializeLayoutBuilderV2State(state);
};
export const addLayoutBuilderV2Node = (
  layout: LayoutSchemaV2,
  regionId: string,
  parentId: string | undefined,
  type: LayoutBuilderV2AddNodeType,
  sectionType: LayoutSectionType = 'itemsTable'
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  if (countV2Nodes(state) >= MAX_LAYOUT_NODE_COUNT) return serializeLayoutBuilderV2State(state);
  const region = state.regions.find(item => item.id === regionId);
  if (!region) return serializeLayoutBuilderV2State(state);
  const containsSectionType = (nodes: LayoutBuilderV2Node[], value: LayoutSectionType): boolean =>
    nodes.some(
      node =>
        (node.node.type === 'section' && node.node.section.type === value) || containsSectionType(node.children, value)
    );
  if (type === 'section' && state.regions.some(item => containsSectionType(item.children, sectionType)))
    return serializeLayoutBuilderV2State(state);
  if (region.region.children === undefined) {
    region.region = { ...region.region, children: region.children.map(item => item.node) };
    delete region.region.blocks;
    delete region.region.sections;
  }
  const parentNode = parentId ? findV2Node(state, parentId)?.node : undefined;
  if (parentId && (!parentNode || findV2NodeDepth(state, parentId)! >= MAX_LAYOUT_NESTING_DEPTH))
    return serializeLayoutBuilderV2State(state);
  const isHeaderBlockParent =
    parentNode?.type === 'node' &&
    ((parentNode.node.type === 'section' && parentNode.node.section.type === 'header') ||
      (parentNode.node.type === 'block' &&
        (parentNode.node.block.type === 'row' || parentNode.node.block.type === 'column')));
  const node: LayoutBuilderV2Node = {
    id: getNextV2NodeId(state, regionId),
    type: 'node',
    node:
      isHeaderBlockParent && type !== 'section'
        ? { type: 'block', block: { type } as HeaderBlock }
        : type === 'section'
          ? { type: 'section', section: { type: sectionType, visible: true } }
          : type === 'row' || type === 'column' || type === 'grid'
            ? { type, children: [] }
            : { type: 'block', block: { type } },
    children: []
  };
  if (!parentId) region.children.push(node);
  else {
    const parent = parentNode;
    if (parent && parent.type === 'node' && canContainLayoutBuilderV2Node(parent.node, node.node))
      parent.children.push(node);
  }
  return serializeLayoutBuilderV2State(state);
};
export const removeLayoutBuilderV2Node = (layout: LayoutSchemaV2, nodeId: string): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const result = findV2Node(state, nodeId);
  if (result?.node.type === 'node') result.parent.splice(result.index, 1);
  return serializeLayoutBuilderV2State(state);
};
export const updateLayoutBuilderV2Node = (
  layout: LayoutSchemaV2,
  nodeId: string,
  update: (node: LayoutNode) => LayoutNode
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const containsNode = (nodes: LayoutBuilderV2Node[], id: string): boolean =>
    nodes.some(node => node.id === id || containsNode(node.children, id));
  const region = state.regions.find(item => containsNode(item.children, nodeId));
  const target = findV2Node(state, nodeId);
  if (
    region &&
    target?.node.type === 'node' &&
    target.node.node.type === 'section' &&
    region.region.children === undefined
  ) {
    region.region = { ...region.region, children: region.children.map(item => item.node) };
    delete region.region.blocks;
    delete region.region.sections;
  }
  const result = findV2Node(state, nodeId);
  if (result?.node.type === 'node') result.node.node = update(result.node.node);
  return serializeLayoutBuilderV2State(state);
};
export const moveLayoutBuilderV2Node = (layout: LayoutSchemaV2, fromId: string, targetId: string): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const from = findV2Node(state, fromId);
  const target = findV2Node(state, targetId);
  if (!from || !target || from.node.type !== 'node' || target.node.type !== 'node' || from.parent !== target.parent)
    return serializeLayoutBuilderV2State(state);
  const parentContainer = findV2ParentContainer(state, fromId);
  if (
    parentContainer &&
    (!canContainLayoutBuilderV2Node(parentContainer, from.node.node) ||
      !canContainLayoutBuilderV2Node(parentContainer, target.node.node))
  )
    return serializeLayoutBuilderV2State(state);
  const [moved] = from.parent.splice(from.index, 1);
  const targetIndex = from.index < target.index ? target.index - 1 : target.index;
  from.parent.splice(targetIndex, 0, moved as LayoutBuilderV2Node);
  return serializeLayoutBuilderV2State(state);
};
export const reparentLayoutBuilderV2Node = (
  layout: LayoutSchemaV2,
  fromId: string,
  targetId: string
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const from = findV2Node(state, fromId);
  const target = findV2Node(state, targetId);
  if (
    !from ||
    !target ||
    from.node.type !== 'node' ||
    target.node.type !== 'node' ||
    !canContainLayoutBuilderV2Node(target.node.node, from.node.node)
  )
    return serializeLayoutBuilderV2State(state);
  const contains = (node: LayoutBuilderV2Node, id: string): boolean =>
    node.id === id || node.children.some(child => contains(child, id));
  if (contains(from.node, targetId)) return serializeLayoutBuilderV2State(state);
  const targetDepth = findV2NodeDepth(state, targetId);
  if (targetDepth === undefined || targetDepth + 1 + getV2SubtreeHeight(from.node) > MAX_LAYOUT_NESTING_DEPTH)
    return serializeLayoutBuilderV2State(state);
  const [moved] = from.parent.splice(from.index, 1);
  target.node.children.push(moved as LayoutBuilderV2Node);
  return serializeLayoutBuilderV2State(state);
};
export const reparentLayoutBuilderV2NodeToRegion = (
  layout: LayoutSchemaV2,
  fromId: string,
  regionId: string
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const from = findV2Node(state, fromId);
  const region = state.regions.find(item => item.id === regionId);
  if (!from || from.node.type !== 'node' || !region || from.parent === region.children)
    return serializeLayoutBuilderV2State(state);
  if (getV2SubtreeHeight(from.node) > MAX_LAYOUT_NESTING_DEPTH) return serializeLayoutBuilderV2State(state);
  if (region.region.children === undefined) {
    region.region = { ...region.region, children: region.children.map(item => item.node) };
    delete region.region.blocks;
    delete region.region.sections;
  }
  const [moved] = from.parent.splice(from.index, 1);
  region.children.push(moved as LayoutBuilderV2Node);
  return serializeLayoutBuilderV2State(state);
};
export const upgradeLayoutToV2 = (layout: LayoutSchema): LayoutSchemaV2 => ({
  schemaVersion: 2,
  meta: { ...layout.meta },
  regions: [
    {
      id: 'main',
      width: '100%',
      direction: 'column',
      children: (layout.sections ?? []).map(section => ({ type: 'section', section }))
    }
  ]
});
