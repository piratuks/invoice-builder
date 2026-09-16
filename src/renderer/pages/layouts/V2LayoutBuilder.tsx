import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  type SelectChangeEvent
} from '@mui/material';
import { useState, type ReactNode } from 'react';
import {
  MAX_LAYOUT_NESTING_DEPTH,
  MAX_LAYOUT_NODE_COUNT,
  validHeaderBooleanProperties,
  validV2ContainerNodeTypes,
  type HeaderBlock,
  type LayoutNode,
  type LayoutSchemaV2,
  type LayoutSectionType
} from '../../shared/types/layouts';
import {
  supportedHeaderBlockAlignments,
  supportedHeaderBlockGaps,
  supportedHeaderBlockTypes,
  supportedLayoutSectionTypes
} from '../../shared/utils/visualBuilderV1';
import {
  canAddLayoutBuilderV2Node,
  canAddLayoutBuilderV2Region,
  canContainLayoutBuilderV2Node,
  canReparentLayoutBuilderV2Node,
  canReparentLayoutBuilderV2NodeToRegion,
  supportedRegionDirections,
  supportedRegionOverflows,
  supportedRegionWidths,
  type LayoutBuilderV2AddNodeType,
  type LayoutBuilderV2Node
} from '../../shared/utils/visualBuilderV2';

type V2State = {
  orientation?: LayoutSchemaV2['orientation'];
  regions: Array<{
    id: string;
    region: LayoutSchemaV2['regions'][number];
    children: LayoutBuilderV2Node[];
  }>;
};

type V2Actions = {
  orientation: (value: LayoutSchemaV2['orientation']) => void;
  addRegion: () => void;
  removeRegion: (id: string) => void;
  renameRegion: (id: string, nextId: string) => void;
  moveRegion: (from: number, to: number) => void;
  updateRegion: (
    id: string,
    value: Partial<Pick<LayoutSchemaV2['regions'][number], 'width' | 'direction' | 'gap' | 'overflow'>>
  ) => void;
  addNode: (
    regionId: string,
    parentId: string | undefined,
    type: LayoutBuilderV2AddNodeType,
    sectionType?: LayoutSectionType
  ) => void;
  removeNode: (id: string) => void;
  moveNode: (from: string, target: string) => void;
  reparentNode: (from: string, target: string) => void;
  reparentNodeToRegion: (from: string, regionId: string) => void;
  updateNode: (id: string, update: (node: LayoutNode) => LayoutNode) => void;
};

type NodeChoice = {
  value: string;
  type: LayoutBuilderV2AddNodeType;
  sectionType?: LayoutSectionType;
};

const labelFor = (node: LayoutBuilderV2Node) =>
  node.node.type === 'section'
    ? node.node.section.type
    : node.node.type === 'block'
      ? node.node.block.type
      : node.node.type;

const isContainer = (node: LayoutBuilderV2Node) =>
  validV2ContainerNodeTypes.includes(node.node.type as never) ||
  (node.node.type === 'section' && node.node.section.type === 'header') ||
  (node.node.type === 'block' && (node.node.block.type === 'row' || node.node.block.type === 'column'));

const containsNode = (node: LayoutBuilderV2Node, id: string): boolean =>
  node.id === id || node.children.some(child => containsNode(child, id));

const findNode = (state: V2State, id: string) => {
  const visit = (nodes: LayoutBuilderV2Node[]): LayoutBuilderV2Node | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const nested = visit(node.children);
      if (nested) return nested;
    }
    return undefined;
  };
  return visit(state.regions.flatMap(region => region.children));
};

const findParent = (state: V2State, id: string) => {
  const visit = (nodes: LayoutBuilderV2Node[], parent: LayoutBuilderV2Node[]): LayoutBuilderV2Node[] | undefined => {
    for (const node of nodes) {
      if (node.id === id) return parent;
      const nested = visit(node.children, node.children);
      if (nested) return nested;
    }
    return undefined;
  };
  for (const region of state.regions) {
    const parent = visit(region.children, region.children);
    if (parent) return parent;
  }
  return undefined;
};

const getChoices = (state: V2State): NodeChoice[] => {
  const hasSection = (type: LayoutSectionType) =>
    state.regions.some(region => {
      const visit = (nodes: LayoutBuilderV2Node[]): boolean =>
        nodes.some(node => (node.node.type === 'section' && node.node.section.type === type) || visit(node.children));
      return visit(region.children);
    });
  return [
    ...validV2ContainerNodeTypes.map(type => ({ value: type, type })),
    ...supportedLayoutSectionTypes
      .filter(type => !hasSection(type))
      .map(sectionType => ({ value: `section:${sectionType}`, type: 'section' as const, sectionType })),
    ...supportedHeaderBlockTypes
      .filter(type => type !== 'row' && type !== 'column')
      .map(type => ({ value: type, type }))
  ];
};

type Props = {
  schema: LayoutSchemaV2;
  state: V2State;
  actions: V2Actions;
  regionNameDrafts: Record<string, string>;
  setRegionNameDrafts: (update: (current: Record<string, string>) => Record<string, string>) => void;
  regionNamesValid: boolean;
  dragOverNode?: string;
  onDragStart: (event: React.DragEvent<HTMLElement>, kind: 'v2Region' | 'v2Node', id: string) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>, kind: 'v2Region' | 'v2Node', id: string) => void;
  onDrop: (event: React.DragEvent<HTMLElement>, kind: 'v2Region' | 'v2Node', id: string) => void;
  onDragEnd: () => void;
  icon: (label: string, onClick: () => void, disabled: boolean, child: ReactNode) => ReactNode;
  t: (key: string) => string;
};

export const V2LayoutBuilder = ({
  schema,
  state,
  actions,
  regionNameDrafts,
  setRegionNameDrafts,
  regionNamesValid,
  dragOverNode,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  icon,
  t
}: Props) => {
  const [expandedNodeId, setExpandedNodeId] = useState<string>();
  const choices = getChoices(state);
  const countNodes = (nodes: LayoutBuilderV2Node[]): number =>
    nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);
  const maxDepth = (nodes: LayoutBuilderV2Node[], depth: number): number =>
    nodes.reduce((current, node) => Math.max(current, maxDepth(node.children, depth + 1)), depth);
  const nodeCount = state.regions.reduce((total, region) => total + countNodes(region.children), 0);
  const depthReached = state.regions.some(region => maxDepth(region.children, 0) >= MAX_LAYOUT_NESTING_DEPTH);
  const nodeLimitReached = nodeCount >= MAX_LAYOUT_NODE_COUNT;
  const limitReached = nodeLimitReached || depthReached;
  const addNode = (regionId: string, parentId: string | undefined, value: string) => {
    const choice = choices.find(item => item.value === value);
    if (choice && canAddLayoutBuilderV2Node(schema, parentId))
      actions.addNode(regionId, parentId, choice.type, choice.sectionType);
  };
  const renderNodeProperties = (node: LayoutBuilderV2Node) => {
    if (expandedNodeId !== node.id) return null;
    const update = (fn: (current: LayoutNode) => LayoutNode) => actions.updateNode(node.id, fn);
    if (node.node.type === 'block') {
      const block = node.node.block;
      const field = (
        value: string,
        onChange: (event: SelectChangeEvent<string>) => void,
        label: string,
        values: string[]
      ) => (
        <Select size="small" displayEmpty value={value} onChange={onChange}>
          <MenuItem value="">{t(label)}</MenuItem>
          {values.map(item => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
      );
      return (
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
          {field(
            block.width ?? '',
            event =>
              update(current =>
                current.type === 'block'
                  ? { ...current, block: { ...current.block, width: event.target.value as HeaderBlock['width'] } }
                  : current
              ),
            'layouts.width',
            supportedRegionWidths
          )}
          {field(
            block.align ?? '',
            event =>
              update(current =>
                current.type === 'block'
                  ? { ...current, block: { ...current.block, align: event.target.value as HeaderBlock['align'] } }
                  : current
              ),
            'layouts.align',
            supportedHeaderBlockAlignments
          )}
          {field(
            String(block.gap ?? ''),
            event =>
              update(current =>
                current.type === 'block'
                  ? {
                      ...current,
                      block: {
                        ...current.block,
                        gap: event.target.value ? (Number(event.target.value) as 5 | 10) : undefined
                      }
                    }
                  : current
              ),
            'layouts.gap',
            supportedHeaderBlockGaps.map(String)
          )}
          {field(
            String(block.paddingTop ?? ''),
            event =>
              update(current =>
                current.type === 'block'
                  ? {
                      ...current,
                      block: {
                        ...current.block,
                        paddingTop: event.target.value ? (Number(event.target.value) as 10 | 20) : undefined
                      }
                    }
                  : current
              ),
            'layouts.paddingTop',
            ['10', '20']
          )}
          {field(
            String(block.paddingBottom ?? ''),
            event =>
              update(current =>
                current.type === 'block'
                  ? { ...current, block: { ...current.block, paddingBottom: event.target.value ? 20 : undefined } }
                  : current
              ),
            'layouts.paddingBottom',
            ['20']
          )}
          {field(
            block.paymentSource ?? '',
            event =>
              update(current =>
                current.type === 'block'
                  ? {
                      ...current,
                      block: { ...current.block, paymentSource: event.target.value as HeaderBlock['paymentSource'] }
                    }
                  : current
              ),
            'layouts.paymentSource',
            ['bank', 'legacyBusiness']
          )}
          {field(
            block.justify ?? '',
            event =>
              update(current =>
                current.type === 'block'
                  ? { ...current, block: { ...current.block, justify: event.target.value as HeaderBlock['justify'] } }
                  : current
              ),
            'layouts.justify',
            ['between']
          )}
          {validHeaderBooleanProperties.map(property => (
            <Select
              key={property}
              size="small"
              displayEmpty
              value={block[property] === undefined ? '' : String(block[property])}
              onChange={event =>
                update(current =>
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
      );
    }
    const isStructural = node.node.type === 'row' || node.node.type === 'column' || node.node.type === 'grid';
    if (node.node.type !== 'section' && !isStructural) return null;
    return (
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
          value={
            node.node.type === 'row' || node.node.type === 'column' || node.node.type === 'grid'
              ? (node.node.width ?? '')
              : ''
          }
          onChange={event =>
            update(current =>
              current.type === 'row' || current.type === 'column' || current.type === 'grid'
                ? { ...current, width: event.target.value || undefined }
                : current
            )
          }
        >
          <MenuItem value="">{t('layouts.width')}</MenuItem>
          {supportedRegionWidths.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          displayEmpty
          value={
            node.node.type === 'row' || node.node.type === 'column' || node.node.type === 'grid'
              ? String(node.node.gap ?? '')
              : ''
          }
          onChange={event =>
            update(current =>
              current.type === 'row' || current.type === 'column' || current.type === 'grid'
                ? { ...current, gap: event.target.value ? (Number(event.target.value) as 5 | 10) : undefined }
                : current
            )
          }
        >
          <MenuItem value="">{t('layouts.gap')}</MenuItem>
          {supportedHeaderBlockGaps.map(value => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </Box>
    );
  };
  const renderNode = (
    regionId: string,
    node: LayoutBuilderV2Node,
    siblings: LayoutBuilderV2Node[],
    depth: number
  ): ReactNode => {
    const index = siblings.findIndex(item => item.id === node.id);
    const layoutDepth = depth - 2;
    const container = isContainer(node);
    const targets: Array<{ value: string; label: string }> = [];
    const collect = (nodes: LayoutBuilderV2Node[], path: string[]) =>
      nodes.forEach(child => {
        const childPath = [...path, labelFor(child)];
        if (isContainer(child)) {
          targets.push({ value: `node:${child.id}`, label: childPath.join(' > ') });
          collect(child.children, childPath);
        }
      });
    state.regions.forEach(region => {
      targets.push({ value: `region:${region.id}`, label: region.id });
      collect(region.children, [region.id]);
    });
    const validTargets = targets.filter(target => {
      if (target.value === `node:${node.id}`) return false;
      if (target.value.startsWith('region:')) return canReparentLayoutBuilderV2NodeToRegion(schema, node.id);
      const targetNode = findNode(state, target.value.slice(5));
      return (
        !!targetNode &&
        !containsNode(node, targetNode.id) &&
        canContainLayoutBuilderV2Node(targetNode.node, node.node) &&
        canReparentLayoutBuilderV2Node(schema, node.id, targetNode.id)
      );
    });
    const parent = findParent(state, node.id);
    const parentChoices =
      parent &&
      ((parent[0]?.node.type === 'section' && parent[0].node.section.type === 'header') ||
        (parent[0]?.node.type === 'block' &&
          (parent[0].node.block.type === 'row' || parent[0].node.block.type === 'column')))
        ? choices.filter(choice => choice.type !== 'section' && choice.type !== 'grid')
        : choices;
    return (
      <Box
        key={node.id}
        role="treeitem"
        aria-level={depth}
        tabIndex={0}
        draggable
        onDragStart={event => onDragStart(event, 'v2Node', node.id)}
        onDragOver={event => onDragOver(event, 'v2Node', node.id)}
        onDrop={event => onDrop(event, 'v2Node', node.id)}
        onDragEnd={onDragEnd}
        sx={{
          ml: 1,
          pl: 1,
          py: 0.5,
          borderLeft: '2px solid',
          borderColor: dragOverNode === `v2Node:${node.id}` ? 'primary.main' : 'divider',
          backgroundColor: dragOverNode === `v2Node:${node.id}` ? 'action.hover' : undefined,
          cursor: 'grab'
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowUp' && index > 0) {
            event.preventDefault();
            actions.moveNode(node.id, siblings[index - 1].id);
          }
          if (event.key === 'ArrowDown' && index < siblings.length - 1) {
            event.preventDefault();
            actions.moveNode(siblings[index + 1].id, node.id);
          }
          if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            actions.removeNode(node.id);
          }
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('ariaLabel.dragToSort')}>
            <DragIndicatorIcon fontSize="small" />
          </Tooltip>
          <Typography variant="body2" sx={{ minWidth: 90, fontWeight: 500 }}>
            {labelFor(node)}
          </Typography>
          {icon(
            t('layouts.moveUp'),
            () => actions.moveNode(node.id, siblings[index - 1]?.id),
            index <= 0,
            <KeyboardArrowUpIcon fontSize="small" />
          )}
          {icon(
            t('layouts.moveDown'),
            () => actions.moveNode(siblings[index + 1]?.id ?? node.id, node.id),
            index < 0 || index === siblings.length - 1,
            <KeyboardArrowDownIcon fontSize="small" />
          )}
          {icon(t('layouts.remove'), () => actions.removeNode(node.id), false, <DeleteIcon fontSize="small" />)}
          {(node.node.type === 'section' || node.node.type === 'block' || container) &&
            icon(
              t('layouts.properties'),
              () => setExpandedNodeId(current => (current === node.id ? undefined : node.id)),
              false,
              <TuneIcon fontSize="small" />
            )}
          <Select
            size="small"
            displayEmpty
            value=""
            onChange={event =>
              event.target.value.startsWith('region:')
                ? actions.reparentNodeToRegion(node.id, event.target.value.slice(7))
                : actions.reparentNode(node.id, event.target.value.slice(5))
            }
            renderValue={() => t('layouts.moveInto')}
            sx={{ minWidth: 112 }}
          >
            {validTargets.map(target => (
              <MenuItem key={target.value} value={target.value}>
                {target.label}
              </MenuItem>
            ))}
          </Select>
          {renderNodeProperties(node)}
          {container && (
            <Box sx={{ width: '100%', borderTop: '1px solid', borderColor: 'divider', pt: 0.75, mt: 0.25 }}>
              <Select
                size="small"
                displayEmpty
                value=""
                disabled={nodeLimitReached || layoutDepth >= MAX_LAYOUT_NESTING_DEPTH}
                onChange={event => addNode(regionId, node.id, event.target.value)}
                renderValue={() => t('layouts.addNode')}
              >
                {parentChoices.map(choice => (
                  <MenuItem key={choice.value} value={choice.value}>
                    {choice.sectionType ?? choice.type}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Stack>
        {node.children.map(child => renderNode(regionId, child, node.children, depth + 1))}
      </Box>
    );
  };

  return (
    <Stack spacing={2}>
      {limitReached && <Alert severity="warning">{t('layouts.limitsReached')}</Alert>}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          V2
        </Typography>
        <Select
          size="small"
          value={state.orientation ?? ''}
          displayEmpty
          onChange={event => actions.orientation((event.target.value || undefined) as LayoutSchemaV2['orientation'])}
        >
          <MenuItem value="">{t('layouts.defaultValue')}</MenuItem>
          <MenuItem value="portrait">portrait</MenuItem>
          <MenuItem value="landscape">landscape</MenuItem>
        </Select>
        <Tooltip title={!canAddLayoutBuilderV2Region(schema) ? t('layouts.noRegionWidthAvailable') : ''}>
          <span>
            <Button
              size="small"
              variant="outlined"
              disabled={!canAddLayoutBuilderV2Region(schema)}
              onClick={actions.addRegion}
            >
              {t('layouts.addRegion')}
            </Button>
          </span>
        </Tooltip>
      </Stack>
      {state.regions.map((region, index) => (
        <Box
          key={region.id}
          draggable
          onDragStart={event => onDragStart(event, 'v2Region', region.id)}
          onDragOver={event => onDragOver(event, 'v2Region', region.id)}
          onDrop={event => onDrop(event, 'v2Region', region.id)}
          onDragEnd={onDragEnd}
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
                const names = state.regions.map(item => (item.id === region.id ? nextId : item.id));
                if (nextId && new Set(names).size === names.length) {
                  actions.renameRegion(region.id, nextId);
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
                actions.updateRegion(region.id, {
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
                actions.updateRegion(region.id, {
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
              displayEmpty
              value={region.region.gap ?? ''}
              onChange={event =>
                actions.updateRegion(region.id, {
                  gap: event.target.value ? (Number(event.target.value) as 5 | 10) : undefined
                })
              }
            >
              <MenuItem value="">{t('layouts.gap')}</MenuItem>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
            </Select>
            <Select
              size="small"
              value={region.region.overflow ?? ''}
              displayEmpty
              onChange={event =>
                actions.updateRegion(region.id, {
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
              () => actions.moveRegion(index, index - 1),
              index === 0,
              <KeyboardArrowUpIcon fontSize="small" />
            )}
            {icon(
              t('layouts.moveDown'),
              () => actions.moveRegion(index, index + 1),
              index === state.regions.length - 1,
              <KeyboardArrowDownIcon fontSize="small" />
            )}
            {icon(t('layouts.remove'), () => actions.removeRegion(region.id), false, <DeleteIcon fontSize="small" />)}
          </Stack>
          {region.children.map(node => renderNode(region.id, node, region.children, 2))}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 1 }}>
            <Select
              size="small"
              displayEmpty
              value=""
              disabled={nodeLimitReached}
              onChange={event => addNode(region.id, undefined, event.target.value)}
              renderValue={() => t('layouts.addNode')}
            >
              {choices.map(choice => (
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
};
