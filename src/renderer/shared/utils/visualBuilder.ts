import {
  type HeaderBlock,
  type HeaderBlockType,
  type LayoutNode,
  type LayoutRegion,
  type LayoutSchema,
  type LayoutSchemaV2,
  type LayoutSection,
  type LayoutSectionType,
  type TotalsRowBlock,
  type TotalsRowBlockType,
  validHeaderBlockAlignments,
  validHeaderBlockGaps,
  validHeaderBlockJustifications,
  validHeaderBlockPaddingBottoms,
  validHeaderBlockPaddingTops,
  validHeaderBlockTypes,
  validHeaderBlockWidths,
  validLayoutSectionTypes,
  validRegionDirections,
  validRegionOverflows,
  validRegionWidths,
  validTotalsRowBlockTypes
} from '../types/layouts';
export type LayoutVisualBuilderSection = LayoutSchema & { sections: LayoutSection[] };
export interface LayoutBuilderNode {
  id: string;
  type: 'section';
  section: LayoutSection;
  children: LayoutBuilderBlockNode[];
}
export interface LayoutBuilderBlockNode {
  id: string;
  type: 'block';
  block: HeaderBlock;
  children: LayoutBuilderBlockNode[];
}
export interface LayoutBuilderState {
  schemaVersion: 1;
  meta: LayoutSchema['meta'];
  nodes: LayoutBuilderNode[];
}
export const supportedLayoutSectionTypes: LayoutSectionType[] = [...validLayoutSectionTypes];
export const supportedHeaderBlockTypes: HeaderBlockType[] = [...validHeaderBlockTypes];
export const supportedTotalsRowBlockTypes: TotalsRowBlockType[] = [...validTotalsRowBlockTypes];
export const supportedRegionDirections = validRegionDirections;
export const supportedRegionWidths = validRegionWidths;
export const supportedRegionOverflows = validRegionOverflows;
export const supportedHeaderBlockWidths = validHeaderBlockWidths;
export const supportedHeaderBlockAlignments = validHeaderBlockAlignments;
export const supportedHeaderBlockGaps = validHeaderBlockGaps;
export const supportedHeaderBlockPaddingTops = validHeaderBlockPaddingTops;
export const supportedHeaderBlockPaddingBottoms = validHeaderBlockPaddingBottoms;
export const supportedHeaderBlockJustifications = validHeaderBlockJustifications;
const buildNodeId = (section: LayoutSection, index: number) => `${section.type}-${index}-${String(section.visible)}`;
const buildBlockNode = (block: HeaderBlock, path: number[]): LayoutBuilderBlockNode => ({
  id: `header-block-${path.join('-')}`,
  type: 'block',
  block: { ...block },
  children: (block.children ?? []).map((child, index) => buildBlockNode(child, [...path, index]))
});
const serializeBlockNode = (node: LayoutBuilderBlockNode): HeaderBlock => {
  const block = { ...node.block };
  delete block.children;
  return {
    ...block,
    ...(node.block.type === 'row' || node.block.type === 'column'
      ? { children: node.children.map(serializeBlockNode) }
      : {})
  };
};
const serializeSectionNode = (node: LayoutBuilderNode): LayoutSection => ({
  ...node.section,
  ...(node.section.type === 'header' ? { blocks: node.children.map(serializeBlockNode) } : {})
});
const findBuilderNode = (
  nodes: LayoutBuilderNode[] | LayoutBuilderBlockNode[],
  id: string
):
  | {
      parent: LayoutBuilderNode[] | LayoutBuilderBlockNode[];
      index: number;
      node: LayoutBuilderNode | LayoutBuilderBlockNode;
    }
  | undefined => {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.id === id) return { parent: nodes, index, node };
    const child = findBuilderNode(node.children, id);
    if (child) return child;
  }
  return undefined;
};
const isContainerNode = (node: LayoutBuilderNode | LayoutBuilderBlockNode) =>
  node.type === 'section' ? node.section.type === 'header' : node.block.type === 'row' || node.block.type === 'column';
const isDescendant = (node: LayoutBuilderBlockNode, targetId: string): boolean =>
  node.children.some(child => child.id === targetId || isDescendant(child, targetId));
const state = (layout: LayoutSchema | LayoutVisualBuilderSection) => createLayoutBuilderState(layout);
export const createLayoutBuilderState = (layout: LayoutSchema | LayoutVisualBuilderSection): LayoutBuilderState => ({
  schemaVersion: 1,
  meta: { ...layout.meta },
  nodes: (layout.sections ?? []).map((section, index) => ({
    id: buildNodeId(section, index),
    type: 'section',
    section: { ...section },
    children:
      section.type === 'header'
        ? (section.blocks ?? []).map((block, blockIndex) => buildBlockNode(block, [index, blockIndex]))
        : []
  }))
});
export const serializeLayoutBuilderState = (builderState: LayoutBuilderState): LayoutVisualBuilderSection => ({
  schemaVersion: 1,
  meta: { ...builderState.meta },
  sections: builderState.nodes.map(serializeSectionNode)
});
export const getAvailableLayoutSectionTypes = (
  layout: LayoutSchema | LayoutVisualBuilderSection
): LayoutSectionType[] =>
  supportedLayoutSectionTypes.filter(type => !state(layout).nodes.some(node => node.section.type === type));
export const addLayoutSection = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  type: LayoutSectionType
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  if (!validLayoutSectionTypes.includes(type) || builderState.nodes.some(node => node.section.type === type))
    return serializeLayoutBuilderState(builderState);
  builderState.nodes.push({
    id: buildNodeId({ type, visible: true }, builderState.nodes.length),
    type: 'section',
    section: { type, visible: true },
    children: []
  });
  return serializeLayoutBuilderState(builderState);
};
export const updateLayoutSection = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  sectionIndex: number,
  update: (section: LayoutSection) => LayoutSection
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const section = builderState.nodes[sectionIndex];
  if (section) section.section = update(section.section);
  return serializeLayoutBuilderState(builderState);
};
export const updateTotalsRowBlock = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  sectionIndex: number,
  blockIndex: number,
  update: (block: TotalsRowBlock) => TotalsRowBlock
): LayoutVisualBuilderSection =>
  updateLayoutSection(layout, sectionIndex, section => {
    if (section.type !== 'totalsRow') return section;
    const totalsBlocks = [...(section.totalsBlocks ?? [])];
    if (totalsBlocks[blockIndex]) totalsBlocks[blockIndex] = update(totalsBlocks[blockIndex]);
    return { ...section, totalsBlocks };
  });
export const removeLayoutSection = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  index: number
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  if (index >= 0 && index < builderState.nodes.length) builderState.nodes.splice(index, 1);
  return serializeLayoutBuilderState(builderState);
};
export const moveLayoutSection = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  fromIndex: number,
  toIndex: number
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  if (fromIndex >= 0 && fromIndex < builderState.nodes.length && toIndex >= 0 && toIndex < builderState.nodes.length) {
    const [moved] = builderState.nodes.splice(fromIndex, 1);
    builderState.nodes.splice(toIndex, 0, moved);
  }
  return serializeLayoutBuilderState(builderState);
};
export const addHeaderBlock = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  sectionIndex: number,
  type: HeaderBlockType,
  parentNodeId?: string
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const section = builderState.nodes[sectionIndex];
  if (!section || section.section.type !== 'header' || !validHeaderBlockTypes.includes(type))
    return serializeLayoutBuilderState(builderState);
  const block: LayoutBuilderBlockNode = {
    id: `header-block-${sectionIndex}-new-${section.children.length}`,
    type: 'block',
    block: { type },
    children: []
  };
  if (!parentNodeId) section.children.push(block);
  else {
    const parent = findBuilderNode(builderState.nodes, parentNodeId);
    if (parent && isContainerNode(parent.node)) parent.node.children.push(block);
  }
  return serializeLayoutBuilderState(builderState);
};
export const addTotalsRowBlock = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  sectionIndex: number,
  type: TotalsRowBlockType
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const section = builderState.nodes[sectionIndex];
  if (!section || section.section.type !== 'totalsRow' || !validTotalsRowBlockTypes.includes(type))
    return serializeLayoutBuilderState(builderState);
  section.section = { ...section.section, totalsBlocks: [...(section.section.totalsBlocks ?? []), { type }] };
  return serializeLayoutBuilderState(builderState);
};
export const removeTotalsRowBlock = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  sectionIndex: number,
  blockIndex: number
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const section = builderState.nodes[sectionIndex];
  if (section?.section.type === 'totalsRow') {
    const blocks = [...(section.section.totalsBlocks ?? [])];
    if (blockIndex >= 0 && blockIndex < blocks.length) {
      blocks.splice(blockIndex, 1);
      section.section = { ...section.section, totalsBlocks: blocks };
    }
  }
  return serializeLayoutBuilderState(builderState);
};
export const moveTotalsRowBlock = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  sectionIndex: number,
  fromIndex: number,
  toIndex: number
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const section = builderState.nodes[sectionIndex];
  if (section?.section.type === 'totalsRow') {
    const blocks = [...(section.section.totalsBlocks ?? [])];
    if (fromIndex >= 0 && fromIndex < blocks.length && toIndex >= 0 && toIndex < blocks.length) {
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      section.section = { ...section.section, totalsBlocks: blocks };
    }
  }
  return serializeLayoutBuilderState(builderState);
};
export const removeBuilderNode = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  nodeId: string
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const result = findBuilderNode(builderState.nodes, nodeId);
  if (result?.node.type === 'block') (result.parent as LayoutBuilderBlockNode[]).splice(result.index, 1);
  return serializeLayoutBuilderState(builderState);
};

export const updateBuilderBlock = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  nodeId: string,
  update: (block: HeaderBlock) => HeaderBlock
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const result = findBuilderNode(builderState.nodes, nodeId);
  if (result?.node.type === 'block') result.node.block = update(result.node.block);
  return serializeLayoutBuilderState(builderState);
};
const moveNode = (builderState: LayoutBuilderState, fromId: string, targetId: string) => {
  const from = findBuilderNode(builderState.nodes, fromId);
  const target = findBuilderNode(builderState.nodes, targetId);
  if (
    !from ||
    !target ||
    from.node.id === target.node.id ||
    from.parent !== target.parent ||
    from.node.type !== target.node.type
  )
    return builderState;
  const targetIndex = from.index < target.index ? target.index - 1 : target.index;
  if (from.node.type === 'section') {
    const parent = from.parent as LayoutBuilderNode[];
    const [moved] = parent.splice(from.index, 1);
    parent.splice(Math.max(0, Math.min(targetIndex, parent.length)), 0, moved);
  } else {
    const parent = from.parent as LayoutBuilderBlockNode[];
    const [moved] = parent.splice(from.index, 1);
    parent.splice(Math.max(0, Math.min(targetIndex, parent.length)), 0, moved);
  }
  return builderState;
};
export const moveBuilderNode = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  fromNodeId: string,
  targetNodeId: string
): LayoutVisualBuilderSection => serializeLayoutBuilderState(moveNode(state(layout), fromNodeId, targetNodeId));
export const reparentBuilderNode = (
  layout: LayoutSchema | LayoutVisualBuilderSection,
  fromNodeId: string,
  targetNodeId: string
): LayoutVisualBuilderSection => {
  const builderState = state(layout);
  const from = findBuilderNode(builderState.nodes, fromNodeId);
  const target = findBuilderNode(builderState.nodes, targetNodeId);
  if (
    from?.node.type === 'block' &&
    target &&
    isContainerNode(target.node) &&
    !isDescendant(from.node, target.node.id)
  ) {
    const [moved] = (from.parent as LayoutBuilderBlockNode[]).splice(from.index, 1);
    target.node.children.push(moved);
  }
  return serializeLayoutBuilderState(builderState);
};
export const reparentLayoutSection = moveLayoutSection;

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

const v2NodeId = (regionId: string, path: number[]) => `layout-node-${regionId}-${path.join('-')}`;
const buildV2Node = (node: LayoutNode, regionId: string, path: number[]): LayoutBuilderV2Node => ({
  id: v2NodeId(regionId, path),
  type: 'node',
  node: { ...node },
  children:
    node.type === 'row' || node.type === 'column' || node.type === 'grid'
      ? node.children.map((child, index) => buildV2Node(child, regionId, [...path, index]))
      : []
});

const serializeV2Node = (builderNode: LayoutBuilderV2Node): LayoutNode => {
  if (builderNode.node.type === 'row' || builderNode.node.type === 'column' || builderNode.node.type === 'grid') {
    return { ...builderNode.node, children: builderNode.children.map(serializeV2Node) };
  }
  return { ...builderNode.node };
};

const regionContent = (region: LayoutRegion): LayoutBuilderV2Node[] => {
  if (region.children) return region.children.map((node, index) => buildV2Node(node, region.id, [index]));
  if (region.blocks) {
    return region.blocks.map((block, index) => buildV2Node({ type: 'block', block }, region.id, [index]));
  }
  return (region.sections ?? []).map((section, index) =>
    buildV2Node({ type: 'section', section: { type: section, visible: true } }, region.id, [index])
  );
};

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
const getNextV2NodeId = (state: LayoutBuilderV2State, regionId: string): string => {
  const ids = new Set<string>();
  const collect = (nodes: LayoutBuilderV2Node[]) => {
    nodes.forEach(node => {
      ids.add(node.id);
      collect(node.children);
    });
  };
  state.regions.forEach(region => collect(region.children));
  let index = 1;
  let id = `new-${regionId}-${index}`;
  while (ids.has(id)) {
    index += 1;
    id = `new-${regionId}-${index}`;
  }
  return id;
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
  update: Partial<Pick<LayoutRegion, 'width' | 'direction' | 'overflow'>>
): LayoutSchemaV2 => {
  const state = createLayoutBuilderV2State(layout);
  const region = state.regions.find(item => item.id === regionId);
  if (region) {
    const nextWidth = update.width ? Number.parseInt(update.width, 10) : Number.parseInt(region.region.width, 10);
    const otherWidth = state.regions
      .filter(item => item.id !== regionId)
      .reduce((total, item) => total + Number.parseInt(item.region.width, 10), 0);
    if (otherWidth + nextWidth <= 100) region.region = { ...region.region, ...update };
    else region.region = { ...region.region, ...update, width: region.region.width };
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
  state.regions.push({
    id,
    type: 'region',
    region: { id, width, direction: 'column', children: [] },
    children: []
  });
  return serializeLayoutBuilderV2State(state);
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
  const region = state.regions.find(item => item.id === regionId);
  if (!region) return serializeLayoutBuilderV2State(state);
  const containsSectionType = (nodes: LayoutBuilderV2Node[], sectionType: LayoutSectionType): boolean =>
    nodes.some(
      node =>
        (node.node.type === 'section' && node.node.section.type === sectionType) ||
        containsSectionType(node.children, sectionType)
    );
  if (type === 'section' && state.regions.some(item => containsSectionType(item.children, sectionType)))
    return serializeLayoutBuilderV2State(state);
  if (region.region.children === undefined) {
    region.region = { ...region.region, children: region.children.map(item => item.node) };
    delete region.region.blocks;
    delete region.region.sections;
  }
  const node: LayoutBuilderV2Node = {
    id: getNextV2NodeId(state, regionId),
    type: 'node',
    node:
      type === 'section'
        ? { type: 'section', section: { type: sectionType, visible: true } }
        : type === 'row' || type === 'column' || type === 'grid'
          ? { type, children: [] }
          : { type: 'block', block: { type } },
    children: []
  };
  if (!parentId) region.children.push(node);
  else {
    const parent = findV2Node(state, parentId)?.node;
    if (parent && parent.type === 'node' && ['row', 'column', 'grid'].includes(parent.node.type))
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
  if (!from || !target || from.node.type !== 'node' || target.node.type !== 'node' || from.parent !== target.parent) {
    return serializeLayoutBuilderV2State(state);
  }
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
  if (!from || !target || from.node.type !== 'node' || target.node.type !== 'node')
    return serializeLayoutBuilderV2State(state);
  if (!['row', 'column', 'grid'].includes(target.node.node.type)) return serializeLayoutBuilderV2State(state);
  const contains = (node: LayoutBuilderV2Node, id: string): boolean =>
    node.id === id || node.children.some(child => contains(child, id));
  if (contains(from.node, targetId)) return serializeLayoutBuilderV2State(state);
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
  if (!from || from.node.type !== 'node' || !region || from.parent === region.children) {
    return serializeLayoutBuilderV2State(state);
  }
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
