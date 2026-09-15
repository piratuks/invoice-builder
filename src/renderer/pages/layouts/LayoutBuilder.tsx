import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TuneIcon from '@mui/icons-material/Tune';
import { Alert, Box, Button, IconButton, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState, type DragEvent as ReactDragEvent, type ReactNode } from 'react';
import {
  parseLayoutSchema,
  validHeaderBooleanProperties,
  validV2ContainerNodeTypes,
  type HeaderBlock,
  type HeaderBlockType,
  type LayoutNode,
  type LayoutSchemaAny,
  type LayoutSchemaV2,
  type LayoutSection,
  type LayoutSectionType,
  type TotalsRowBlock,
  type TotalsRowBlockType
} from '../../shared/types/layouts';
import {
  addHeaderBlock,
  addLayoutBuilderV2Node,
  addLayoutBuilderV2Region,
  addLayoutSection,
  addTotalsRowBlock,
  createLayoutBuilderState,
  createLayoutBuilderV2State,
  getAvailableLayoutSectionTypes,
  moveBuilderNode,
  moveLayoutBuilderV2Node,
  moveLayoutBuilderV2Region,
  moveLayoutSection,
  moveTotalsRowBlock,
  removeBuilderNode,
  removeLayoutBuilderV2Node,
  removeLayoutBuilderV2Region,
  removeLayoutSection,
  removeTotalsRowBlock,
  renameLayoutBuilderV2Region,
  reparentBuilderNode,
  reparentLayoutBuilderV2Node,
  reparentLayoutBuilderV2NodeToRegion,
  setLayoutBuilderV2Orientation,
  supportedHeaderBlockAlignments,
  supportedHeaderBlockGaps,
  supportedHeaderBlockJustifications,
  supportedHeaderBlockPaddingBottoms,
  supportedHeaderBlockPaddingTops,
  supportedHeaderBlockTypes,
  supportedHeaderBlockWidths,
  supportedLayoutSectionTypes,
  supportedRegionDirections,
  supportedRegionOverflows,
  supportedRegionWidths,
  supportedTotalsRowBlockTypes,
  updateBuilderBlock,
  updateLayoutBuilderV2Node,
  updateLayoutBuilderV2Region,
  updateLayoutSection,
  updateTotalsRowBlock,
  upgradeLayoutToV2,
  type LayoutBuilderBlockNode,
  type LayoutBuilderV2AddNodeType,
  type LayoutBuilderV2Node
} from './../../shared/utils/visualBuilder';

export const LayoutBuilder = ({
  schema,
  onSchemaChange,
  onValidityChange,
  t
}: {
  schema: string;
  onSchemaChange: (schema: string) => void;
  onValidityChange?: (valid: boolean) => void;
  t: (key: string) => string;
}) => {
  const [showUpgradeNotice, setShowUpgradeNotice] = useState(false);
  const [regionNameDrafts, setRegionNameDrafts] = useState<Record<string, string>>({});
  const [expandedV1NodeId, setExpandedV1NodeId] = useState<string>();
  const [expandedV1SectionIndex, setExpandedV1SectionIndex] = useState<number>();
  const [expandedV1TotalsBlock, setExpandedV1TotalsBlock] = useState<string>();
  const [expandedV2TotalsBlock, setExpandedV2TotalsBlock] = useState<string>();
  const [expandedV2NodeId, setExpandedV2NodeId] = useState<string>();
  const [draggedNode, setDraggedNode] = useState<{
    kind: 'section' | 'block' | 'v2Region' | 'v2Node';
    id: string;
  }>();
  const [dragOverNode, setDragOverNode] = useState<string>();
  useEffect(() => {
    if (!showUpgradeNotice) return;
    const timeout = window.setTimeout(() => setShowUpgradeNotice(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [showUpgradeNotice]);
  const parsedSchema = useMemo(() => parseLayoutSchema(schema), [schema]);
  const builderState = useMemo(() => {
    const parsed = parseLayoutSchema(schema);
    return parsed.errors.length || !parsed.schema || parsed.schema.schemaVersion !== 1
      ? undefined
      : createLayoutBuilderState(parsed.schema);
  }, [schema]);
  const builderV2State = useMemo(
    () => (parsedSchema.schema?.schemaVersion === 2 ? createLayoutBuilderV2State(parsedSchema.schema) : undefined),
    [parsedSchema]
  );
  const regionNamesValid = useMemo(() => {
    if (!builderV2State) return true;
    const names = builderV2State.regions.map(region => regionNameDrafts[region.id] ?? region.id);
    return names.every(name => name.trim().length > 0) && new Set(names.map(name => name.trim())).size === names.length;
  }, [builderV2State, regionNameDrafts]);
  useEffect(() => {
    onValidityChange?.(regionNamesValid);
    return () => onValidityChange?.(true);
  }, [onValidityChange, regionNamesValid]);
  const sections = builderState?.nodes.map(node => node.section) ?? [];
  const update = (next: LayoutSchemaAny) => onSchemaChange(JSON.stringify(next, null, 2));
  const apply = (fn: (schema: Extract<LayoutSchemaAny, { schemaVersion: 1 }>) => LayoutSchemaAny) => {
    const parsed = parseLayoutSchema(schema);
    if (!parsed.errors.length && parsed.schema?.schemaVersion === 1) update(fn(parsed.schema));
  };
  const actions = {
    addSection: (type: LayoutSectionType) => apply(current => addLayoutSection(current, type)),
    moveSection: (a: number, b: number) => apply(current => moveLayoutSection(current, a, b)),
    removeSection: (a: number) => apply(current => removeLayoutSection(current, a)),
    addBlock: (a: number, type: HeaderBlockType, parent?: string) =>
      apply(current => addHeaderBlock(current, a, type, parent)),
    moveBlock: (a: string, b: string) => apply(current => moveBuilderNode(current, a, b)),
    reparent: (a: string, b: string) => apply(current => reparentBuilderNode(current, a, b)),
    removeBlock: (a: string) => apply(current => removeBuilderNode(current, a)),
    updateBlock: (id: string, update: (block: HeaderBlock) => HeaderBlock) =>
      apply(current => updateBuilderBlock(current, id, update)),
    updateSection: (index: number, update: (section: LayoutSection) => LayoutSection) =>
      apply(current => updateLayoutSection(current, index, update)),
    updateTotalsBlock: (sectionIndex: number, blockIndex: number, update: (block: TotalsRowBlock) => TotalsRowBlock) =>
      apply(current => updateTotalsRowBlock(current, sectionIndex, blockIndex, update)),
    addTotals: (a: number, type: TotalsRowBlockType) => apply(current => addTotalsRowBlock(current, a, type)),
    moveTotals: (a: number, b: number, c: number) => apply(current => moveTotalsRowBlock(current, a, b, c)),
    removeTotals: (a: number, b: number) => apply(current => removeTotalsRowBlock(current, a, b))
  };
  const updateV2 = (next: LayoutSchemaV2) => update(next);
  const v2Actions = {
    orientation: (value: LayoutSchemaV2['orientation']) =>
      updateV2(setLayoutBuilderV2Orientation(parsedSchema.schema as LayoutSchemaV2, value)),
    addRegion: () => updateV2(addLayoutBuilderV2Region(parsedSchema.schema as LayoutSchemaV2)),
    removeRegion: (id: string) => updateV2(removeLayoutBuilderV2Region(parsedSchema.schema as LayoutSchemaV2, id)),
    renameRegion: (id: string, nextId: string) =>
      updateV2(renameLayoutBuilderV2Region(parsedSchema.schema as LayoutSchemaV2, id, nextId)),
    moveRegion: (from: number, to: number) =>
      updateV2(moveLayoutBuilderV2Region(parsedSchema.schema as LayoutSchemaV2, from, to)),
    updateRegion: (
      id: string,
      value: Partial<Pick<LayoutSchemaV2['regions'][number], 'width' | 'direction' | 'overflow'>>
    ) => updateV2(updateLayoutBuilderV2Region(parsedSchema.schema as LayoutSchemaV2, id, value)),
    addNode: (
      regionId: string,
      parentId: string | undefined,
      type: LayoutBuilderV2AddNodeType,
      sectionType?: LayoutSectionType
    ) => updateV2(addLayoutBuilderV2Node(parsedSchema.schema as LayoutSchemaV2, regionId, parentId, type, sectionType)),
    removeNode: (id: string) => updateV2(removeLayoutBuilderV2Node(parsedSchema.schema as LayoutSchemaV2, id)),
    moveNode: (from: string, target: string) =>
      updateV2(moveLayoutBuilderV2Node(parsedSchema.schema as LayoutSchemaV2, from, target)),
    reparentNode: (from: string, target: string) =>
      updateV2(reparentLayoutBuilderV2Node(parsedSchema.schema as LayoutSchemaV2, from, target)),
    reparentNodeToRegion: (from: string, regionId: string) =>
      updateV2(reparentLayoutBuilderV2NodeToRegion(parsedSchema.schema as LayoutSchemaV2, from, regionId)),
    updateNode: (id: string, update: (node: LayoutNode) => LayoutNode) =>
      updateV2(updateLayoutBuilderV2Node(parsedSchema.schema as LayoutSchemaV2, id, update))
  };
  const upgradeWithOrientation = (orientation: LayoutSchemaV2['orientation']) => {
    if (parsedSchema.schema?.schemaVersion !== 1 || !orientation) return;
    const upgraded = upgradeLayoutToV2(parsedSchema.schema);
    update(setLayoutBuilderV2Orientation(upgraded, orientation));
    setShowUpgradeNotice(true);
  };
  type V2UpgradeFeature = 'addRegion' | 'addGrid' | 'continue' | 'keepTogether';
  const upgradeWithFeature = (feature: V2UpgradeFeature) => {
    if (parsedSchema.schema?.schemaVersion !== 1) return;
    let upgraded = upgradeLayoutToV2(parsedSchema.schema);
    if (feature === 'addRegion') upgraded = addLayoutBuilderV2Region(upgraded);
    if (feature === 'addGrid') upgraded = addLayoutBuilderV2Node(upgraded, 'main', undefined, 'grid');
    if (feature === 'continue' || feature === 'keepTogether') {
      upgraded = updateLayoutBuilderV2Region(upgraded, 'main', { overflow: feature });
    }
    update(upgraded);
    setShowUpgradeNotice(true);
  };
  const containers = (
    nodes: LayoutBuilderBlockNode[],
    path: string[] = []
  ): { node: LayoutBuilderBlockNode; label: string }[] =>
    nodes.flatMap((node, index) => {
      const label = `${node.block.type} ${index + 1}${node.children.length ? ` (${node.children.map(child => child.block.type).join(', ')})` : ''}`;
      const next = [...path, label];
      return [
        ...(node.block.type === 'row' || node.block.type === 'column' ? [{ node, label: next.join(' > ') }] : []),
        ...containers(node.children, next)
      ];
    });
  const contains = (node: LayoutBuilderBlockNode, id: string): boolean =>
    node.id === id || node.children.some(child => contains(child, id));
  const findNode = (id: string) => {
    if (!builderState) return undefined;
    const visit = (nodes: LayoutBuilderBlockNode[]): LayoutBuilderBlockNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const nested = visit(node.children);
        if (nested) return nested;
      }
      return undefined;
    };
    return visit(builderState.nodes.flatMap(node => node.children));
  };
  const findParent = (id: string): LayoutBuilderBlockNode[] | undefined => {
    if (!builderState) return undefined;
    const visit = (
      nodes: LayoutBuilderBlockNode[],
      parent: LayoutBuilderBlockNode[]
    ): LayoutBuilderBlockNode[] | undefined => {
      for (const node of nodes) {
        if (node.id === id) return parent;
        const nested = visit(node.children, node.children);
        if (nested) return nested;
      }
      return undefined;
    };
    for (const section of builderState.nodes) {
      const parent = visit(section.children, section.children);
      if (parent) return parent;
    }
    return undefined;
  };
  const canDrop = (
    active: { kind: 'section' | 'block'; id: string },
    target: { kind: 'section' | 'block'; id: string }
  ) => {
    if (active.id === target.id || !builderState) return false;
    if (active.kind === 'section' || target.kind === 'section') {
      return active.kind === 'section' && target.kind === 'section';
    }
    const activeNode = findNode(active.id);
    const targetNode = findNode(target.id);
    if (!activeNode || !targetNode || contains(activeNode, target.id)) return false;
    return (
      targetNode.block.type === 'row' ||
      targetNode.block.type === 'column' ||
      findParent(active.id) === findParent(target.id)
    );
  };
  const findV2Node = (id: string): LayoutBuilderV2Node | undefined => {
    const visit = (nodes: LayoutBuilderV2Node[]): LayoutBuilderV2Node | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const nested = visit(node.children);
        if (nested) return nested;
      }
      return undefined;
    };
    return builderV2State?.regions.flatMap(region => region.children).length
      ? visit(builderV2State.regions.flatMap(region => region.children))
      : undefined;
  };
  const findV2Parent = (id: string): LayoutBuilderV2Node[] | undefined => {
    const visit = (nodes: LayoutBuilderV2Node[], parent: LayoutBuilderV2Node[]): LayoutBuilderV2Node[] | undefined => {
      for (const node of nodes) {
        if (node.id === id) return parent;
        const nested = visit(node.children, node.children);
        if (nested) return nested;
      }
      return undefined;
    };
    for (const region of builderV2State?.regions ?? []) {
      const parent = visit(region.children, region.children);
      if (parent) return parent;
    }
    return undefined;
  };
  const v2NodeContains = (node: LayoutBuilderV2Node, id: string): boolean =>
    node.id === id || node.children.some(child => v2NodeContains(child, id));
  const canDropV2 = (
    active: { kind: 'v2Region' | 'v2Node'; id: string },
    target: { kind: 'v2Region' | 'v2Node'; id: string }
  ) => {
    if (!builderV2State || active.id === target.id) return false;
    if (active.kind === 'v2Region' || target.kind === 'v2Region') {
      return active.kind === 'v2Region' && target.kind === 'v2Region';
    }
    const activeNode = findV2Node(active.id);
    const targetNode = findV2Node(target.id);
    if (!activeNode || !targetNode || v2NodeContains(activeNode, target.id)) return false;
    const isContainer = (node: LayoutBuilderV2Node) =>
      node.node.type === 'row' || node.node.type === 'column' || node.node.type === 'grid';
    return isContainer(targetNode) || findV2Parent(active.id) === findV2Parent(target.id);
  };
  type DragData = {
    kind: 'section' | 'block' | 'v2Region' | 'v2Node';
    id: string;
  };
  const isV2Kind = (kind: DragData['kind']): kind is 'v2Region' | 'v2Node' => kind === 'v2Region' || kind === 'v2Node';
  const readDragData = (event: ReactDragEvent<HTMLElement>): DragData | undefined => {
    try {
      return JSON.parse(event.dataTransfer.getData('text/plain')) as DragData;
    } catch {
      return undefined;
    }
  };
  const handleDragStart = (
    event: ReactDragEvent<HTMLElement>,
    kind: 'section' | 'block' | 'v2Region' | 'v2Node',
    id: string
  ) => {
    event.stopPropagation();
    const data = { kind, id };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(data));
    setDraggedNode(data);
  };
  const handleDragOver = (
    event: ReactDragEvent<HTMLElement>,
    kind: 'section' | 'block' | 'v2Region' | 'v2Node',
    id: string
  ) => {
    event.stopPropagation();
    const active = readDragData(event) ?? draggedNode;
    if (!active) return;
    if (isV2Kind(active.kind) || isV2Kind(kind)) {
      if (!isV2Kind(active.kind) || !isV2Kind(kind) || !canDropV2({ kind: active.kind, id: active.id }, { kind, id }))
        return;
    } else if (
      !canDrop({ kind: active.kind as 'section' | 'block', id: active.id }, { kind: kind as 'section' | 'block', id })
    )
      return;
    {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setDragOverNode(`${kind}:${id}`);
    }
  };
  const handleDrop = (
    event: ReactDragEvent<HTMLElement>,
    kind: 'section' | 'block' | 'v2Region' | 'v2Node',
    id: string
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const active = readDragData(event) ?? draggedNode;
    if (!active) return;
    const isV2Drop = isV2Kind(active.kind) && isV2Kind(kind);
    if (isV2Kind(active.kind) || isV2Kind(kind)) {
      if (
        !isV2Drop ||
        !canDropV2(
          { kind: active.kind as 'v2Region' | 'v2Node', id: active.id },
          {
            kind: kind as 'v2Region' | 'v2Node',
            id
          }
        )
      )
        return;
    } else if (
      !canDrop({ kind: active.kind as 'section' | 'block', id: active.id }, { kind: kind as 'section' | 'block', id })
    )
      return;
    if (isV2Drop) {
      if (active.kind === 'v2Region') {
        const fromIndex = builderV2State?.regions.findIndex(region => region.id === active.id) ?? -1;
        const toIndex = builderV2State?.regions.findIndex(region => region.id === id) ?? -1;
        v2Actions.moveRegion(fromIndex, toIndex);
      } else if (kind === 'v2Region') {
        v2Actions.reparentNodeToRegion(active.id, id);
      } else {
        const targetNode = findV2Node(id);
        const activeParent = findV2Parent(active.id);
        const targetParent = findV2Parent(id);
        const targetIsContainer = targetNode && validV2ContainerNodeTypes.includes(targetNode.node.type as never);
        if (targetIsContainer && activeParent !== targetParent) v2Actions.reparentNode(active.id, id);
        else if (targetIsContainer && activeParent === targetParent) {
          const fromIndex = activeParent?.findIndex(node => node.id === active.id) ?? -1;
          const toIndex = targetParent?.findIndex(node => node.id === id) ?? -1;
          v2Actions.moveNode(fromIndex < toIndex ? id : active.id, fromIndex < toIndex ? active.id : id);
        } else v2Actions.moveNode(active.id, id);
      }
      setDraggedNode(undefined);
      setDragOverNode(undefined);
      return;
    }
    if (active.kind === 'section') {
      const fromIndex = builderState?.nodes.findIndex(node => node.id === active.id) ?? -1;
      const toIndex = builderState?.nodes.findIndex(node => node.id === id) ?? -1;
      actions.moveSection(fromIndex, toIndex);
    } else if (kind === 'section') {
      actions.reparent(active.id, id);
    } else {
      const activeBlock = findNode(active.id);
      const targetBlock = findNode(id);
      const activeIsContainer = activeBlock?.block.type === 'row' || activeBlock?.block.type === 'column';
      const targetIsContainer = targetBlock?.block.type === 'row' || targetBlock?.block.type === 'column';
      const activeParent = findParent(active.id);
      const targetParent = findParent(id);
      const sameParent = activeParent === targetParent;
      if (targetIsContainer && !(activeIsContainer && sameParent)) actions.reparent(active.id, id);
      else if (sameParent && activeParent && targetParent) {
        const activeIndex = activeParent.findIndex(node => node.id === active.id);
        const targetIndex = targetParent.findIndex(node => node.id === id);
        actions.moveBlock(activeIndex < targetIndex ? id : active.id, activeIndex < targetIndex ? active.id : id);
      } else actions.moveBlock(active.id, id);
    }
    setDraggedNode(undefined);
    setDragOverNode(undefined);
  };
  const clearDragState = () => {
    setDraggedNode(undefined);
    setDragOverNode(undefined);
  };
  const icon = (label: string, onClick: () => void, disabled = false, child: ReactNode) => (
    <Tooltip title={label}>
      <span>
        <IconButton size="small" aria-label={label} disabled={disabled} onClick={onClick}>
          {child}
        </IconButton>
      </span>
    </Tooltip>
  );
  const hasV2SectionType = (sectionType: LayoutSectionType): boolean => {
    const contains = (nodes: LayoutBuilderV2Node[]): boolean =>
      nodes.some(
        node => (node.node.type === 'section' && node.node.section.type === sectionType) || contains(node.children)
      );
    return builderV2State?.regions.some(region => contains(region.children)) ?? false;
  };
  const availableV2NodeChoices: Array<{
    value: string;
    type: LayoutBuilderV2AddNodeType;
    sectionType?: LayoutSectionType;
  }> = [
    ...validV2ContainerNodeTypes.map(type => ({ value: type, type })),
    ...supportedLayoutSectionTypes
      .filter(type => !hasV2SectionType(type))
      .map(sectionType => ({ value: `section:${sectionType}`, type: 'section' as const, sectionType })),
    ...supportedHeaderBlockTypes
      .filter(type => type !== 'row' && type !== 'column')
      .map(type => ({ value: type, type }))
  ];
  const addV2NodeFromChoice = (regionId: string, parentId: string | undefined, value: string) => {
    const choice = availableV2NodeChoices.find(item => item.value === value);
    if (choice) v2Actions.addNode(regionId, parentId, choice.type, choice.sectionType);
  };
  const v2ReparentTargets = (node: LayoutBuilderV2Node) => {
    const targets: Array<{ value: string; label: string }> = [];
    const collect = (regionId: string, nodes: LayoutBuilderV2Node[], path: string[]) => {
      nodes.forEach(child => {
        const childLabel =
          child.node.type === 'section'
            ? child.node.section.type
            : child.node.type === 'block'
              ? child.node.block.type
              : child.node.type;
        const childPath = [...path, childLabel];
        if (child.node.type === 'row' || child.node.type === 'column' || child.node.type === 'grid') {
          targets.push({ value: `node:${child.id}`, label: childPath.join(' > ') });
          collect(regionId, child.children, childPath);
        }
      });
    };
    builderV2State?.regions.forEach(region => {
      targets.push({ value: `region:${region.id}`, label: region.id });
      collect(region.id, region.children, [region.id]);
    });
    return targets.filter(target => {
      if (target.value === `node:${node.id}`) return false;
      if (target.value.startsWith('node:')) {
        const targetNode = findV2Node(target.value.slice(5));
        return targetNode ? !v2NodeContains(node, targetNode.id) : false;
      }
      return true;
    });
  };
  const reparentV2NodeFromMenu = (node: LayoutBuilderV2Node, value: string) => {
    if (value.startsWith('region:')) v2Actions.reparentNodeToRegion(node.id, value.slice(7));
    if (value.startsWith('node:')) v2Actions.reparentNode(node.id, value.slice(5));
  };
  const renderV2Node = (
    regionId: string,
    node: LayoutBuilderV2Node,
    siblings: LayoutBuilderV2Node[],
    depth: number
  ): ReactNode => {
    const index = siblings.findIndex(item => item.id === node.id);
    const isContainer = node.node.type === 'row' || node.node.type === 'column' || node.node.type === 'grid';
    const containerNode =
      node.node.type === 'row' || node.node.type === 'column' || node.node.type === 'grid' ? node.node : undefined;
    const label =
      node.node.type === 'section'
        ? node.node.section.type
        : node.node.type === 'block'
          ? node.node.block.type
          : node.node.type;
    const block = node.node.type === 'block' ? node.node.block : undefined;
    const showV2Properties = expandedV2NodeId === node.id;
    return (
      <Box
        key={node.id}
        role="treeitem"
        aria-level={depth}
        draggable
        onDragStart={event => handleDragStart(event, 'v2Node', node.id)}
        onDragOver={event => handleDragOver(event, 'v2Node', node.id)}
        onDrop={event => handleDrop(event, 'v2Node', node.id)}
        onDragEnd={clearDragState}
        sx={{
          ml: 1,
          pl: 1,
          py: 0.5,
          borderLeft: '2px solid',
          borderColor: dragOverNode === `v2Node:${node.id}` ? 'primary.main' : 'divider',
          backgroundColor: dragOverNode === `v2Node:${node.id}` ? 'action.hover' : undefined,
          cursor: 'grab'
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('ariaLabel.dragToSort')}>
            <DragIndicatorIcon fontSize="small" sx={{ cursor: 'grab' }} />
          </Tooltip>
          <Typography variant="body2" sx={{ minWidth: 90, fontWeight: 500 }}>
            {label}
          </Typography>
          {icon(
            t('layouts.moveUp'),
            () => v2Actions.moveNode(node.id, siblings[index - 1]?.id),
            index <= 0,
            <KeyboardArrowUpIcon fontSize="small" />
          )}
          {icon(
            t('layouts.moveDown'),
            () => v2Actions.moveNode(siblings[index + 1]?.id ?? node.id, node.id),
            index < 0 || index === siblings.length - 1,
            <KeyboardArrowDownIcon fontSize="small" />
          )}
          {icon(t('layouts.remove'), () => v2Actions.removeNode(node.id), false, <DeleteIcon fontSize="small" />)}
          {(node.node.type === 'section' || node.node.type === 'block' || isContainer) &&
            icon(
              t('layouts.properties'),
              () => setExpandedV2NodeId(current => (current === node.id ? undefined : node.id)),
              false,
              <TuneIcon fontSize="small" />
            )}
          <Select
            size="small"
            displayEmpty
            value=""
            onChange={event => reparentV2NodeFromMenu(node, event.target.value)}
            renderValue={() => t('layouts.moveInto')}
            sx={{ minWidth: 112 }}
          >
            {v2ReparentTargets(node).map(target => (
              <MenuItem key={target.value} value={target.value}>
                {target.label}
              </MenuItem>
            ))}
          </Select>
          {showV2Properties && node.node.type === 'section' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, max-content))',
                gap: 0.5,
                width: '100%',
                mt: 0.75,
                pt: 0.75,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Select
                size="small"
                value={String(node.node.section.visible)}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'section'
                      ? {
                          ...current,
                          section: {
                            ...current.section,
                            visible: event.target.value === 'auto' ? 'auto' : event.target.value === 'true'
                          }
                        }
                      : current
                  )
                }
              >
                <MenuItem value="true">{t('layouts.visible')}</MenuItem>
                <MenuItem value="false">{t('layouts.hidden')}</MenuItem>
                <MenuItem value="auto">auto</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.section.watermarkOrder ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'section'
                      ? { ...current, section: { ...current.section, watermarkOrder: event.target.value || undefined } }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.defaultValue')}</MenuItem>
                <MenuItem value="default">default</MenuItem>
                <MenuItem value="paidFirst">paidFirst</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.section.columnSizing ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'section'
                      ? { ...current, section: { ...current.section, columnSizing: event.target.value || undefined } }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.tableDefault')}</MenuItem>
                <MenuItem value="fixedFlex">fixedFlex</MenuItem>
                <MenuItem value="proportional">proportional</MenuItem>
              </Select>
              {node.node.section.type === 'totalsRow' && (
                <Box sx={{ gridColumn: '1 / -1', borderTop: '1px solid', borderColor: 'divider', pt: 0.75 }}>
                  <Stack spacing={0.75}>
                    <Box sx={{ pb: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Select
                        size="small"
                        displayEmpty
                        value=""
                        onChange={event =>
                          v2Actions.updateNode(node.id, current =>
                            current.type === 'section'
                              ? {
                                  ...current,
                                  section: {
                                    ...current.section,
                                    totalsBlocks: [
                                      ...(current.section.totalsBlocks ?? []),
                                      { type: event.target.value as TotalsRowBlockType }
                                    ]
                                  }
                                }
                              : current
                          )
                        }
                        renderValue={() => t('layouts.addBlock')}
                      >
                        {supportedTotalsRowBlockTypes.map(type => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                    {(node.node.section.totalsBlocks ?? []).map((block, blockIndex) => (
                      <Box key={`${block.type}-${blockIndex}`}>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="body2">{block.type}</Typography>
                          {icon(
                            t('layouts.moveUp'),
                            () =>
                              v2Actions.updateNode(node.id, current => {
                                if (current.type !== 'section') return current;
                                const blocks = [...(current.section.totalsBlocks ?? [])];
                                if (blockIndex > 0)
                                  [blocks[blockIndex - 1], blocks[blockIndex]] = [
                                    blocks[blockIndex],
                                    blocks[blockIndex - 1]
                                  ];
                                return { ...current, section: { ...current.section, totalsBlocks: blocks } };
                              }),
                            blockIndex === 0,
                            <KeyboardArrowUpIcon fontSize="small" />
                          )}
                          {icon(
                            t('layouts.moveDown'),
                            () =>
                              v2Actions.updateNode(node.id, current => {
                                if (current.type !== 'section') return current;
                                const blocks = [...(current.section.totalsBlocks ?? [])];
                                if (blockIndex < blocks.length - 1)
                                  [blocks[blockIndex], blocks[blockIndex + 1]] = [
                                    blocks[blockIndex + 1],
                                    blocks[blockIndex]
                                  ];
                                return { ...current, section: { ...current.section, totalsBlocks: blocks } };
                              }),
                            blockIndex ===
                              ((node.node.type === 'section' ? node.node.section.totalsBlocks?.length : undefined) ??
                                1) -
                                1,
                            <KeyboardArrowDownIcon fontSize="small" />
                          )}
                          {icon(
                            t('layouts.remove'),
                            () =>
                              v2Actions.updateNode(node.id, current => {
                                if (current.type !== 'section') return current;
                                const blocks = [...(current.section.totalsBlocks ?? [])];
                                blocks.splice(blockIndex, 1);
                                return { ...current, section: { ...current.section, totalsBlocks: blocks } };
                              }),
                            false,
                            <DeleteIcon fontSize="small" />
                          )}
                          {block.type === 'paymentInfo' &&
                            icon(
                              t('layouts.properties'),
                              () =>
                                setExpandedV2TotalsBlock(current =>
                                  current === `${node.id}:${blockIndex}` ? undefined : `${node.id}:${blockIndex}`
                                ),
                              false,
                              <TuneIcon fontSize="small" />
                            )}
                        </Stack>
                        {block.type === 'paymentInfo' && expandedV2TotalsBlock === `${node.id}:${blockIndex}` && (
                          <Box sx={{ mt: 0.5 }}>
                            <Select
                              size="small"
                              displayEmpty
                              value={block.paymentSource ?? ''}
                              onChange={event =>
                                v2Actions.updateNode(node.id, current => {
                                  if (current.type !== 'section') return current;
                                  const blocks = [...(current.section.totalsBlocks ?? [])];
                                  blocks[blockIndex] = {
                                    ...blocks[blockIndex],
                                    paymentSource: event.target.value || undefined
                                  };
                                  return { ...current, section: { ...current.section, totalsBlocks: blocks } };
                                })
                              }
                            >
                              <MenuItem value="">{t('layouts.paymentSource')}</MenuItem>
                              <MenuItem value="bank">bank</MenuItem>
                              <MenuItem value="legacyBusiness">legacyBusiness</MenuItem>
                            </Select>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
          {showV2Properties && node.node.type === 'block' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, max-content))',
                gap: 0.5,
                width: '100%',
                mt: 0.75,
                pt: 0.75,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Select
                size="small"
                displayEmpty
                value={node.node.block.width ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'block'
                      ? { ...current, block: { ...current.block, width: event.target.value || undefined } }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.width')}</MenuItem>
                {supportedHeaderBlockWidths.map(width => (
                  <MenuItem key={width} value={width}>
                    {width}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.block.align ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'block'
                      ? { ...current, block: { ...current.block, align: event.target.value || undefined } }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.align')}</MenuItem>
                {supportedHeaderBlockAlignments.map(align => (
                  <MenuItem key={align} value={align}>
                    {align}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.block.gap ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'block'
                      ? {
                          ...current,
                          block: {
                            ...current.block,
                            gap: event.target.value ? (Number(event.target.value) as 5 | 10) : undefined
                          }
                        }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.gap')}</MenuItem>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.block.paddingTop ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'block'
                      ? {
                          ...current,
                          block: {
                            ...current.block,
                            paddingTop: event.target.value ? (Number(event.target.value) as 10 | 20) : undefined
                          }
                        }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.paddingTop')}</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.block.paddingBottom ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'block'
                      ? {
                          ...current,
                          block: {
                            ...current.block,
                            paddingBottom: event.target.value ? (Number(event.target.value) as 20) : undefined
                          }
                        }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.paddingBottom')}</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.block.paymentSource ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'block'
                      ? {
                          ...current,
                          block: {
                            ...current.block,
                            paymentSource: event.target.value || undefined
                          }
                        }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.paymentSource')}</MenuItem>
                <MenuItem value="bank">bank</MenuItem>
                <MenuItem value="legacyBusiness">legacyBusiness</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={node.node.block.justify ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'block'
                      ? { ...current, block: { ...current.block, justify: event.target.value || undefined } }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.justify')}</MenuItem>
                <MenuItem value="between">between</MenuItem>
              </Select>
              {validHeaderBooleanProperties.map(property => (
                <Select
                  key={property}
                  size="small"
                  displayEmpty
                  value={block?.[property] === undefined ? '' : String(block[property])}
                  onChange={event =>
                    v2Actions.updateNode(node.id, current =>
                      current.type === 'block'
                        ? {
                            ...current,
                            block: {
                              ...current.block,
                              [property]: event.target.value === '' ? undefined : event.target.value === 'true'
                            }
                          }
                        : current
                    )
                  }
                >
                  <MenuItem value="">{t(`layouts.${property}`)}</MenuItem>
                  <MenuItem value="true">{t('layouts.enabled')}</MenuItem>
                  <MenuItem value="false">{t('layouts.disabled')}</MenuItem>
                </Select>
              ))}
            </Box>
          )}
          {showV2Properties && isContainer && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, max-content))',
                gap: 0.5,
                width: '100%',
                mt: 0.75,
                mb: 0.75,
                pb: 0.75,
                pt: 0.75,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Select
                size="small"
                displayEmpty
                value={containerNode?.width ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'row' || current.type === 'column' || current.type === 'grid'
                      ? { ...current, width: event.target.value || undefined }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.width')}</MenuItem>
                {supportedRegionWidths.map(width => (
                  <MenuItem key={width} value={width}>
                    {width}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                displayEmpty
                value={containerNode?.gap ?? ''}
                onChange={event =>
                  v2Actions.updateNode(node.id, current =>
                    current.type === 'row' || current.type === 'column' || current.type === 'grid'
                      ? { ...current, gap: event.target.value ? (Number(event.target.value) as 5 | 10) : undefined }
                      : current
                  )
                }
              >
                <MenuItem value="">{t('layouts.gap')}</MenuItem>
                {supportedHeaderBlockGaps.map(gap => (
                  <MenuItem key={gap} value={gap}>
                    {gap}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
          {isContainer && (
            <Box
              sx={{
                width: '100%',
                borderTop: '1px solid',
                borderColor: 'divider',
                pt: 0.75,
                mt: 0.25
              }}
            >
              <Select
                size="small"
                displayEmpty
                value=""
                onChange={event => addV2NodeFromChoice(regionId, node.id, event.target.value)}
                renderValue={() => t('layouts.addNode')}
              >
                {availableV2NodeChoices.map(choice => (
                  <MenuItem key={choice.value} value={choice.value}>
                    {choice.sectionType ?? choice.type}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Stack>
        {node.children.map(child => renderV2Node(regionId, child, node.children, depth + 1))}
      </Box>
    );
  };
  const renderV2Builder = () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          V2
        </Typography>
        <Select
          size="small"
          value={builderV2State?.orientation ?? ''}
          displayEmpty
          onChange={event => v2Actions.orientation((event.target.value || undefined) as LayoutSchemaV2['orientation'])}
        >
          <MenuItem value="">{t('layouts.defaultValue')}</MenuItem>
          <MenuItem value="portrait">portrait</MenuItem>
          <MenuItem value="landscape">landscape</MenuItem>
        </Select>
        <Button size="small" variant="outlined" onClick={v2Actions.addRegion}>
          {t('layouts.addRegion')}
        </Button>
      </Stack>
      {builderV2State?.regions.map((region, index) => (
        <Box
          key={region.id}
          draggable
          onDragStart={event => handleDragStart(event, 'v2Region', region.id)}
          onDragOver={event => handleDragOver(event, 'v2Region', region.id)}
          onDrop={event => handleDrop(event, 'v2Region', region.id)}
          onDragEnd={clearDragState}
          sx={{
            border: '1px solid',
            borderColor: dragOverNode === `v2Region:${region.id}` ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 1,
            mb: 0.5,
            backgroundColor: dragOverNode === `v2Region:${region.id}` ? 'action.hover' : undefined,
            cursor: 'grab'
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip title={t('ariaLabel.dragToSort')}>
              <DragIndicatorIcon fontSize="small" sx={{ cursor: 'grab' }} />
            </Tooltip>
            <TextField
              size="small"
              value={regionNameDrafts[region.id] ?? region.id}
              onMouseDown={event => event.stopPropagation()}
              onChange={event => setRegionNameDrafts(current => ({ ...current, [region.id]: event.target.value }))}
              onBlur={event => {
                const nextId = event.target.value.trim();
                const names = builderV2State?.regions.map(item => (item.id === region.id ? nextId : item.id)) ?? [];
                if (nextId && new Set(names).size === names.length) {
                  v2Actions.renameRegion(region.id, nextId);
                  setRegionNameDrafts(current => {
                    const next = { ...current };
                    delete next[region.id];
                    return next;
                  });
                }
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') {
                  (event.target as HTMLInputElement).value = region.id;
                  event.currentTarget.blur();
                }
              }}
              error={!regionNamesValid}
              helperText={!regionNamesValid ? t('layouts.uniqueRegionId') : undefined}
              slotProps={{ htmlInput: { 'aria-label': region.id } }}
              sx={{ width: 140 }}
            />
            <Select
              size="small"
              value={region.region.width}
              onChange={event =>
                v2Actions.updateRegion(region.id, {
                  width: event.target.value as LayoutSchemaV2['regions'][number]['width']
                })
              }
            >
              {supportedRegionWidths.map(width => (
                <MenuItem key={width} value={width}>
                  {width}
                </MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              value={region.region.direction}
              onChange={event =>
                v2Actions.updateRegion(region.id, {
                  direction: event.target.value as LayoutSchemaV2['regions'][number]['direction']
                })
              }
            >
              {supportedRegionDirections.map(direction => (
                <MenuItem key={direction} value={direction}>
                  {direction}
                </MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              value={region.region.overflow ?? ''}
              displayEmpty
              onChange={event =>
                v2Actions.updateRegion(region.id, {
                  overflow: (event.target.value || undefined) as LayoutSchemaV2['regions'][number]['overflow']
                })
              }
            >
              <MenuItem value="">{t('layouts.wrap')}</MenuItem>
              {supportedRegionOverflows.map(overflow => (
                <MenuItem key={overflow} value={overflow}>
                  {overflow}
                </MenuItem>
              ))}
            </Select>
            {icon(
              t('layouts.moveUp'),
              () => v2Actions.moveRegion(index, index - 1),
              index === 0,
              <KeyboardArrowUpIcon fontSize="small" />
            )}
            {icon(
              t('layouts.moveDown'),
              () => v2Actions.moveRegion(index, index + 1),
              index === builderV2State.regions.length - 1,
              <KeyboardArrowDownIcon fontSize="small" />
            )}
            {icon(t('layouts.remove'), () => v2Actions.removeRegion(region.id), false, <DeleteIcon fontSize="small" />)}
          </Stack>
          {region.children.map(node => renderV2Node(region.id, node, region.children, 2))}
          <Box
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 1,
              mt: 1
            }}
          >
            <Select
              size="small"
              displayEmpty
              value=""
              onChange={event => addV2NodeFromChoice(region.id, undefined, event.target.value)}
              renderValue={() => t('layouts.addNode')}
            >
              {availableV2NodeChoices.map(choice => (
                <MenuItem key={choice.value} value={choice.value}>
                  {choice.sectionType ?? choice.type}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      ))}
    </Stack>
  );
  const renderV1Properties = (node: LayoutBuilderBlockNode): ReactNode => {
    if (expandedV1NodeId !== node.id) return null;
    const update = (change: Partial<HeaderBlock>) => actions.updateBlock(node.id, block => ({ ...block, ...change }));
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, max-content))',
          gap: 0.5,
          width: '100%',
          mt: 0.5
        }}
      >
        <Select
          size="small"
          displayEmpty
          value={node.block.width ?? ''}
          onChange={event => update({ width: event.target.value || undefined })}
        >
          <MenuItem value="">{t('layouts.width')}</MenuItem>
          {supportedHeaderBlockWidths.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={node.block.align ?? ''}
          onChange={event => update({ align: event.target.value || undefined })}
        >
          <MenuItem value="">{t('layouts.align')}</MenuItem>
          {supportedHeaderBlockAlignments.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={node.block.gap ?? ''}
          onChange={event => update({ gap: event.target.value ? (Number(event.target.value) as 5 | 10) : undefined })}
        >
          <MenuItem value="">{t('layouts.gap')}</MenuItem>
          {supportedHeaderBlockGaps.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={node.block.paddingTop ?? ''}
          onChange={event =>
            update({ paddingTop: event.target.value ? (Number(event.target.value) as 10 | 20) : undefined })
          }
        >
          <MenuItem value="">{t('layouts.paddingTop')}</MenuItem>
          {supportedHeaderBlockPaddingTops.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={node.block.paddingBottom ?? ''}
          onChange={event => update({ paddingBottom: event.target.value ? 20 : undefined })}
        >
          <MenuItem value="">{t('layouts.paddingBottom')}</MenuItem>
          {supportedHeaderBlockPaddingBottoms.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={node.block.paymentSource ?? ''}
          onChange={event => update({ paymentSource: event.target.value || undefined })}
        >
          <MenuItem value="">{t('layouts.paymentSource')}</MenuItem>
          <MenuItem value="bank">bank</MenuItem>
          <MenuItem value="legacyBusiness">legacyBusiness</MenuItem>
        </Select>
        <Select
          size="small"
          displayEmpty
          value={node.block.justify ?? ''}
          onChange={event => update({ justify: event.target.value || undefined })}
        >
          <MenuItem value="">{t('layouts.justify')}</MenuItem>
          {supportedHeaderBlockJustifications.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        {validHeaderBooleanProperties.map(property => (
          <Select
            key={property}
            size="small"
            displayEmpty
            value={node.block[property] === undefined ? '' : String(node.block[property])}
            onChange={event =>
              update({ [property]: event.target.value === '' ? undefined : event.target.value === 'true' })
            }
          >
            <MenuItem value="">{t(`layouts.${property}`)}</MenuItem>
            <MenuItem value="true">{t('layouts.enabled')}</MenuItem>
            <MenuItem value="false">{t('layouts.disabled')}</MenuItem>
          </Select>
        ))}
      </Box>
    );
  };
  const renderV1SectionProperties = (section: LayoutSection, index: number): ReactNode => {
    if (expandedV1SectionIndex !== index) return null;
    const update = (change: Partial<LayoutSection>) =>
      actions.updateSection(index, current => ({ ...current, ...change }));
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, max-content))',
          gap: 0.5,
          mt: 0.75,
          pt: 0.75,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Select
          size="small"
          value={String(section.visible)}
          onChange={event =>
            update({ visible: event.target.value === 'auto' ? 'auto' : event.target.value === 'true' })
          }
        >
          <MenuItem value="true">{t('layouts.visible')}</MenuItem>
          <MenuItem value="false">{t('layouts.hidden')}</MenuItem>
          <MenuItem value="auto">auto</MenuItem>
        </Select>
        <Select
          size="small"
          displayEmpty
          value={section.watermarkOrder ?? ''}
          onChange={event => update({ watermarkOrder: event.target.value || undefined })}
        >
          <MenuItem value="">{t('layouts.defaultValue')}</MenuItem>
          <MenuItem value="default">default</MenuItem>
          <MenuItem value="paidFirst">paidFirst</MenuItem>
        </Select>
        <Select
          size="small"
          displayEmpty
          value={section.columnSizing ?? ''}
          onChange={event => update({ columnSizing: event.target.value || undefined })}
        >
          <MenuItem value="">{t('layouts.tableDefault')}</MenuItem>
          <MenuItem value="fixedFlex">fixedFlex</MenuItem>
          <MenuItem value="proportional">proportional</MenuItem>
        </Select>
      </Box>
    );
  };
  const renderBlock = (
    node: LayoutBuilderBlockNode,
    siblings: LayoutBuilderBlockNode[],
    targets: { node: LayoutBuilderBlockNode; label: string }[],
    sectionIndex: number,
    depth: number
  ): ReactNode => {
    const index = siblings.findIndex(item => item.id === node.id);
    const isContainer = node.block.type === 'row' || node.block.type === 'column';
    return (
      <Box
        key={node.id}
        role="treeitem"
        aria-level={depth}
        tabIndex={0}
        draggable
        onDragStart={event => handleDragStart(event, 'block', node.id)}
        onDragOver={event => handleDragOver(event, 'block', node.id)}
        onDrop={event => handleDrop(event, 'block', node.id)}
        onDragEnd={clearDragState}
        sx={{
          pl: 2,
          ml: 1,
          py: 0.5,
          borderLeft: '2px solid',
          borderColor: dragOverNode === `block:${node.id}` ? 'primary.main' : 'divider',
          backgroundColor: dragOverNode === `block:${node.id}` ? 'action.hover' : undefined,
          cursor: 'grab'
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowUp' && index > 0) actions.moveBlock(node.id, siblings[index - 1].id);
          if (event.key === 'ArrowDown' && index < siblings.length - 1)
            actions.moveBlock(siblings[index + 1].id, node.id);
          if (event.key === 'Delete' || event.key === 'Backspace') actions.removeBlock(node.id);
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('ariaLabel.dragToSort')}>
            <DragIndicatorIcon fontSize="small" sx={{ cursor: 'grab' }} />
          </Tooltip>
          <Typography variant="body2" sx={{ minWidth: 92, fontWeight: 500 }}>
            {node.block.type}
          </Typography>
          {icon(
            t('layouts.moveUp'),
            () => actions.moveBlock(node.id, siblings[index - 1].id),
            index <= 0,
            <KeyboardArrowUpIcon fontSize="small" />
          )}
          {icon(
            t('layouts.moveDown'),
            () => actions.moveBlock(siblings[index + 1].id, node.id),
            index < 0 || index === siblings.length - 1,
            <KeyboardArrowDownIcon fontSize="small" />
          )}
          {icon(t('layouts.remove'), () => actions.removeBlock(node.id), false, <DeleteIcon fontSize="small" />)}
          {icon(
            t('layouts.properties'),
            () => setExpandedV1NodeId(current => (current === node.id ? undefined : node.id)),
            false,
            <TuneIcon fontSize="small" />
          )}
          <Select
            size="small"
            displayEmpty
            value=""
            onChange={event => actions.reparent(node.id, event.target.value)}
            renderValue={() => t('layouts.moveInto')}
            sx={{ minWidth: 112 }}
          >
            {targets
              .filter(target => target.node.id !== node.id && !contains(node, target.node.id))
              .map(target => (
                <MenuItem key={target.node.id} value={target.node.id}>
                  {target.label}
                </MenuItem>
              ))}
          </Select>
          {isContainer && (
            <Select
              size="small"
              displayEmpty
              value=""
              onChange={event => actions.addBlock(sectionIndex, event.target.value as HeaderBlockType, node.id)}
              renderValue={() => t('layouts.addBlock')}
            >
              {supportedHeaderBlockTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          )}
        </Stack>
        {renderV1Properties(node)}
        {node.children.map(child => renderBlock(child, node.children, targets, sectionIndex, depth + 1))}
      </Box>
    );
  };
  const available = builderState
    ? getAvailableLayoutSectionTypes({ schemaVersion: 1, meta: builderState.meta, sections })
    : supportedLayoutSectionTypes;
  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Stack spacing={2}>
        {showUpgradeNotice && <Alert severity="info">{t('layouts.upgradedToV2')}</Alert>}
        {builderV2State ? (
          renderV2Builder()
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Select
              size="small"
              displayEmpty
              value=""
              onChange={event => upgradeWithOrientation(event.target.value as LayoutSchemaV2['orientation'])}
              renderValue={() => t('layouts.orientation')}
            >
              <MenuItem value="">{t('layouts.defaultValue')}</MenuItem>
              <MenuItem value="portrait">portrait</MenuItem>
              <MenuItem value="landscape">landscape</MenuItem>
            </Select>
            <Select
              size="small"
              displayEmpty
              value=""
              onChange={event => upgradeWithFeature(event.target.value as V2UpgradeFeature)}
              renderValue={() => t('layouts.v2Feature')}
            >
              <MenuItem value="">{t('layouts.defaultValue')}</MenuItem>
              <MenuItem value="addRegion">{t('layouts.addRegion')}</MenuItem>
              <MenuItem value="addGrid">{t('layouts.addGrid')}</MenuItem>
              <MenuItem value="continue">continue</MenuItem>
              <MenuItem value="keepTogether">keepTogether</MenuItem>
            </Select>
          </Stack>
        )}
        {!builderV2State && (
          <>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('layouts.sections')}
              </Typography>
              <Select
                size="small"
                displayEmpty
                value=""
                onChange={event => actions.addSection(event.target.value as LayoutSectionType)}
                renderValue={() => t('layouts.addSection')}
              >
                {available.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            {sections.length === 0 ? (
              <Typography color="text.secondary">{t('layouts.noSections')}</Typography>
            ) : (
              <Stack role="tree" aria-label={t('layouts.sections')} spacing={1}>
                {sections.map((section, index) => (
                  <Box
                    key={`${section.type}-${index}`}
                    role="treeitem"
                    aria-level={1}
                    tabIndex={0}
                    draggable
                    onDragStart={event => handleDragStart(event, 'section', builderState?.nodes[index].id ?? '')}
                    onDragOver={event => handleDragOver(event, 'section', builderState?.nodes[index].id ?? '')}
                    onDrop={event => handleDrop(event, 'section', builderState?.nodes[index].id ?? '')}
                    onDragEnd={clearDragState}
                    sx={{
                      border: '1px solid',
                      borderColor:
                        dragOverNode === `section:${builderState?.nodes[index].id}` ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1,
                      backgroundColor:
                        dragOverNode === `section:${builderState?.nodes[index].id}` ? 'action.hover' : undefined
                    }}
                    onKeyDown={event => {
                      if (event.key === 'ArrowUp' && index > 0) {
                        event.preventDefault();
                        actions.moveSection(index, index - 1);
                      }
                      if (event.key === 'ArrowDown' && index < sections.length - 1) {
                        event.preventDefault();
                        actions.moveSection(index, index + 1);
                      }
                      if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault();
                        actions.removeSection(index);
                      }
                    }}
                  >
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        <Tooltip title={t('ariaLabel.dragToSort')}>
                          <DragIndicatorIcon fontSize="small" sx={{ cursor: 'grab' }} />
                        </Tooltip>
                        <Typography sx={{ fontWeight: 600 }}>{section.type}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.25}>
                        {icon(
                          t('layouts.moveUp'),
                          () => actions.moveSection(index, index - 1),
                          index === 0,
                          <KeyboardArrowUpIcon fontSize="small" />
                        )}
                        {icon(
                          t('layouts.moveDown'),
                          () => actions.moveSection(index, index + 1),
                          index === sections.length - 1,
                          <KeyboardArrowDownIcon fontSize="small" />
                        )}
                        {icon(
                          t('layouts.remove'),
                          () => actions.removeSection(index),
                          false,
                          <DeleteIcon fontSize="small" />
                        )}
                        {icon(
                          t('layouts.properties'),
                          () => setExpandedV1SectionIndex(current => (current === index ? undefined : index)),
                          false,
                          <TuneIcon fontSize="small" />
                        )}
                      </Stack>
                    </Stack>
                    {renderV1SectionProperties(section, index)}
                    {section.type === 'header' && builderState?.nodes[index] && (
                      <Stack spacing={1} sx={{ mt: 1, pl: 2 }} role="group">
                        <Select
                          size="small"
                          displayEmpty
                          value=""
                          onChange={event => actions.addBlock(index, event.target.value as HeaderBlockType)}
                          renderValue={() => t('layouts.addBlock')}
                        >
                          {supportedHeaderBlockTypes.map(type => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                        {builderState.nodes[index].children.map(node =>
                          renderBlock(
                            node,
                            builderState.nodes[index].children,
                            containers(builderState.nodes[index].children),
                            index,
                            2
                          )
                        )}
                      </Stack>
                    )}
                    {section.type === 'totalsRow' && (
                      <Stack spacing={1} sx={{ mt: 1, pl: 2 }} role="group">
                        <Select
                          size="small"
                          displayEmpty
                          value=""
                          onChange={event => actions.addTotals(index, event.target.value as TotalsRowBlockType)}
                          renderValue={() => t('layouts.addBlock')}
                        >
                          {supportedTotalsRowBlockTypes.map(type => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                        {(section.totalsBlocks ?? []).map((block, blockIndex) => (
                          <Box
                            key={`${block.type}-${blockIndex}`}
                            sx={{
                              borderTop: block.type === 'paymentInfo' ? '1px solid' : undefined,
                              borderColor: 'divider',
                              pt: block.type === 'paymentInfo' ? 0.75 : 0
                            }}
                          >
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ minWidth: 112 }}>
                                {block.type}
                              </Typography>
                              {icon(
                                t('layouts.moveUp'),
                                () => actions.moveTotals(index, blockIndex, blockIndex - 1),
                                blockIndex === 0,
                                <KeyboardArrowUpIcon fontSize="small" />
                              )}
                              {icon(
                                t('layouts.moveDown'),
                                () => actions.moveTotals(index, blockIndex, blockIndex + 1),
                                blockIndex === (section.totalsBlocks?.length ?? 1) - 1,
                                <KeyboardArrowDownIcon fontSize="small" />
                              )}
                              {icon(
                                t('layouts.remove'),
                                () => actions.removeTotals(index, blockIndex),
                                false,
                                <DeleteIcon fontSize="small" />
                              )}
                              {block.type === 'paymentInfo' &&
                                icon(
                                  t('layouts.properties'),
                                  () =>
                                    setExpandedV1TotalsBlock(current =>
                                      current === `${index}:${blockIndex}` ? undefined : `${index}:${blockIndex}`
                                    ),
                                  false,
                                  <TuneIcon fontSize="small" />
                                )}
                            </Stack>
                            {block.type === 'paymentInfo' && expandedV1TotalsBlock === `${index}:${blockIndex}` && (
                              <Select
                                size="small"
                                displayEmpty
                                value={block.paymentSource ?? ''}
                                onChange={event =>
                                  actions.updateTotalsBlock(index, blockIndex, current => ({
                                    ...current,
                                    paymentSource: event.target.value || undefined
                                  }))
                                }
                              >
                                <MenuItem value="">{t('layouts.paymentSource')}</MenuItem>
                                <MenuItem value="bank">bank</MenuItem>
                                <MenuItem value="legacyBusiness">legacyBusiness</MenuItem>
                              </Select>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};
