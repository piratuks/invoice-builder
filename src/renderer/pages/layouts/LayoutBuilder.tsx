import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import { Alert, Box, IconButton, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState, type DragEvent as ReactDragEvent, type ReactNode } from 'react';
import {
  parseLayoutSchema,
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
  addLayoutSection,
  addTotalsRowBlock,
  createLayoutBuilderState,
  moveBuilderNode,
  moveLayoutSection,
  moveTotalsRowBlock,
  removeBuilderNode,
  removeLayoutSection,
  removeTotalsRowBlock,
  reparentBuilderNode,
  updateBuilderBlock,
  updateLayoutSection,
  updateTotalsRowBlock,
  type LayoutBuilderBlockNode
} from './../../shared/utils/visualBuilderV1';
import {
  addLayoutBuilderV2Node,
  addLayoutBuilderV2Region,
  canContainLayoutBuilderV2Node,
  createLayoutBuilderV2State,
  moveLayoutBuilderV2Node,
  moveLayoutBuilderV2Region,
  removeLayoutBuilderV2Node,
  removeLayoutBuilderV2Region,
  renameLayoutBuilderV2Region,
  reparentLayoutBuilderV2Node,
  reparentLayoutBuilderV2NodeToRegion,
  setLayoutBuilderV2Orientation,
  updateLayoutBuilderV2Node,
  updateLayoutBuilderV2Region,
  upgradeLayoutToV2,
  type LayoutBuilderV2AddNodeType,
  type LayoutBuilderV2Node
} from './../../shared/utils/visualBuilderV2';
import { V1LayoutBuilder } from './V1LayoutBuilder';
import { V2LayoutBuilder } from './V2LayoutBuilder';

const MAX_HISTORY_ENTRIES = 50;

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
  const [draggedNode, setDraggedNode] = useState<{
    kind: 'section' | 'block' | 'v2Region' | 'v2Node';
    id: string;
  }>();
  const [dragOverNode, setDragOverNode] = useState<string>();
  const [historyState, setHistoryState] = useState({ value: schema, past: [] as string[], future: [] as string[] });
  const [pendingSchema, setPendingSchema] = useState<string>();
  useEffect(() => {
    if (pendingSchema !== undefined) {
      if (pendingSchema === schema) setPendingSchema(undefined);
      return;
    }
    if (historyState.value === schema) return;
    setHistoryState({ value: schema, past: [], future: [] });
  }, [historyState, pendingSchema, schema]);
  const commitSchema = (nextSchema: string) => {
    if (nextSchema === historyState.value) return;
    setHistoryState({
      value: nextSchema,
      past: [...historyState.past, historyState.value].slice(-MAX_HISTORY_ENTRIES),
      future: []
    });
    setPendingSchema(nextSchema);
    onSchemaChange(nextSchema);
  };
  const undo = useCallback(() => {
    const previous = historyState.past.at(-1);
    if (!previous) return;
    setHistoryState({
      value: previous,
      past: historyState.past.slice(0, -1),
      future: [historyState.value, ...historyState.future].slice(0, MAX_HISTORY_ENTRIES)
    });
    setPendingSchema(previous);
    onSchemaChange(previous);
  }, [historyState, onSchemaChange]);
  const redo = useCallback(() => {
    const next = historyState.future[0];
    if (!next) return;
    setHistoryState({
      value: next,
      past: [...historyState.past, historyState.value].slice(-MAX_HISTORY_ENTRIES),
      future: historyState.future.slice(1)
    });
    setPendingSchema(next);
    onSchemaChange(next);
  }, [historyState, onSchemaChange]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((!event.ctrlKey && !event.metaKey) || event.altKey || event.key.toLowerCase() !== 'z') return;
      const canUndo = historyState.past.length > 0;
      const canRedo = historyState.future.length > 0;
      if (event.shiftKey ? canRedo : canUndo) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyState, redo, undo]);
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
  const update = (next: LayoutSchemaAny) => commitSchema(JSON.stringify(next, null, 2));
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
      value: Partial<Pick<LayoutSchemaV2['regions'][number], 'width' | 'direction' | 'gap' | 'overflow'>>
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
  const isV2Container = (node: LayoutBuilderV2Node) =>
    validV2ContainerNodeTypes.includes(node.node.type as never) ||
    (node.node.type === 'section' && node.node.section.type === 'header') ||
    (node.node.type === 'block' && (node.node.block.type === 'row' || node.node.block.type === 'column'));
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
    if (isV2Container(targetNode)) return canContainLayoutBuilderV2Node(targetNode.node, activeNode.node);
    return findV2Parent(active.id) === findV2Parent(target.id);
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
        const targetIsContainer = targetNode && isV2Container(targetNode);
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
  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          {icon(t('layouts.undo'), undo, historyState.past.length === 0, <UndoIcon fontSize="small" />)}
          {icon(t('layouts.redo'), redo, historyState.future.length === 0, <RedoIcon fontSize="small" />)}
        </Stack>
        {showUpgradeNotice && (
          <Alert severity="info">
            <Typography component="div">{t('layouts.upgradedToV2')}</Typography>
            <Typography component="div" variant="body2">
              {t('layouts.upgradedToV2Details')}
            </Typography>
          </Alert>
        )}
        {builderV2State ? (
          <V2LayoutBuilder
            schema={parsedSchema.schema as LayoutSchemaV2}
            state={builderV2State}
            actions={v2Actions}
            regionNameDrafts={regionNameDrafts}
            setRegionNameDrafts={setRegionNameDrafts}
            regionNamesValid={regionNamesValid}
            dragOverNode={dragOverNode}
            onDragStart={(event, kind, id) => handleDragStart(event, kind, id)}
            onDragOver={(event, kind, id) => handleDragOver(event, kind, id)}
            onDrop={(event, kind, id) => handleDrop(event, kind, id)}
            onDragEnd={clearDragState}
            icon={icon}
            t={t}
          />
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
        {!builderV2State && builderState && (
          <V1LayoutBuilder
            sections={sections}
            nodes={builderState.nodes}
            meta={builderState.meta}
            dragOverNode={dragOverNode}
            expandedNodeId={expandedV1NodeId}
            expandedSectionIndex={expandedV1SectionIndex}
            expandedTotalsBlock={expandedV1TotalsBlock}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={clearDragState}
            onToggleNode={id => setExpandedV1NodeId(current => (current === id ? undefined : id))}
            onToggleSection={index => setExpandedV1SectionIndex(current => (current === index ? undefined : index))}
            onToggleTotalsBlock={(index, blockIndex) =>
              setExpandedV1TotalsBlock(current =>
                current === `${index}:${blockIndex}` ? undefined : `${index}:${blockIndex}`
              )
            }
            onAddSection={actions.addSection}
            onMoveSection={actions.moveSection}
            onRemoveSection={actions.removeSection}
            onAddBlock={actions.addBlock}
            onMoveBlock={actions.moveBlock}
            onReparent={actions.reparent}
            onRemoveBlock={actions.removeBlock}
            onUpdateBlock={actions.updateBlock}
            onUpdateSection={actions.updateSection}
            onAddTotals={actions.addTotals}
            onMoveTotals={actions.moveTotals}
            onRemoveTotals={actions.removeTotals}
            onUpdateTotalsBlock={actions.updateTotalsBlock}
            icon={icon}
            t={t}
          />
        )}
      </Stack>
    </Box>
  );
};
