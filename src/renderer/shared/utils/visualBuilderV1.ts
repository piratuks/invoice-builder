import {
  type HeaderBlock,
  type HeaderBlockType,
  type LayoutSchema,
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
export const supportedHeaderBlockWidths = validHeaderBlockWidths;
export const supportedHeaderBlockAlignments = validHeaderBlockAlignments;
export const supportedHeaderBlockGaps = validHeaderBlockGaps;
export const supportedHeaderBlockPaddingTops = validHeaderBlockPaddingTops;
export const supportedHeaderBlockPaddingBottoms = validHeaderBlockPaddingBottoms;
export const supportedHeaderBlockJustifications = validHeaderBlockJustifications;

const buildNodeId = (section: LayoutSection) => `section-${section.type}-${String(section.visible)}`;
const hashBlock = (block: HeaderBlock): string => {
  const serialized = JSON.stringify(block);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};
const buildBlockNode = (block: HeaderBlock, occurrenceCounts: Map<string, number>): LayoutBuilderBlockNode => {
  const identity = hashBlock(block);
  const occurrence = occurrenceCounts.get(identity) ?? 0;
  occurrenceCounts.set(identity, occurrence + 1);
  return {
    id: `header-block-${identity}-${occurrence}`,
    type: 'block',
    block: { ...block },
    children: (block.children ?? []).map(child => buildBlockNode(child, occurrenceCounts))
  };
};
const buildBlockNodes = (blocks: HeaderBlock[]) => {
  const counts = new Map<string, number>();
  return blocks.map(block => buildBlockNode(block, counts));
};
const countBlockIdentities = (nodes: LayoutBuilderBlockNode[], counts: Map<string, number>) => {
  nodes.forEach(node => {
    const identity = hashBlock(node.block);
    counts.set(identity, (counts.get(identity) ?? 0) + 1);
    countBlockIdentities(node.children, counts);
  });
};
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
  nodes: (layout.sections ?? []).map(section => ({
    id: buildNodeId(section),
    type: 'section',
    section: { ...section },
    children: section.type === 'header' ? buildBlockNodes(section.blocks ?? []) : []
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
    id: buildNodeId({ type, visible: true }),
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
  const counts = new Map<string, number>();
  countBlockIdentities(section.children, counts);
  const block = buildBlockNode({ type }, counts);
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
