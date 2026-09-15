import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TuneIcon from '@mui/icons-material/Tune';
import { Box, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import {
  type HeaderBlock,
  type HeaderBlockType,
  type LayoutSection,
  type LayoutSectionType,
  type TotalsRowBlockType
} from '../../shared/types/layouts';
import {
  getAvailableLayoutSectionTypes,
  supportedHeaderBlockTypes,
  supportedTotalsRowBlockTypes,
  type LayoutBuilderBlockNode,
  type LayoutBuilderNode
} from '../../shared/utils/visualBuilderV1';
import { V1LayoutBuilderControls, V1LayoutBuilderSectionControls } from './V1LayoutBuilderControls';

type DragKind = 'section' | 'block';

type Props = {
  sections: LayoutSection[];
  nodes: LayoutBuilderNode[];
  meta: { name: string };
  dragOverNode?: string;
  expandedNodeId?: string;
  expandedSectionIndex?: number;
  expandedTotalsBlock?: string;
  onDragStart: (event: React.DragEvent<HTMLElement>, kind: DragKind, id: string) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>, kind: DragKind, id: string) => void;
  onDrop: (event: React.DragEvent<HTMLElement>, kind: DragKind, id: string) => void;
  onDragEnd: () => void;
  onToggleNode: (id: string) => void;
  onToggleSection: (index: number) => void;
  onToggleTotalsBlock: (index: number, blockIndex: number) => void;
  onAddSection: (type: LayoutSectionType) => void;
  onMoveSection: (from: number, to: number) => void;
  onRemoveSection: (index: number) => void;
  onAddBlock: (sectionIndex: number, type: HeaderBlockType, parent?: string) => void;
  onMoveBlock: (from: string, to: string) => void;
  onReparent: (from: string, target: string) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, update: (block: HeaderBlock) => HeaderBlock) => void;
  onUpdateSection: (index: number, update: (section: LayoutSection) => LayoutSection) => void;
  onAddTotals: (sectionIndex: number, type: TotalsRowBlockType) => void;
  onMoveTotals: (sectionIndex: number, from: number, to: number) => void;
  onRemoveTotals: (sectionIndex: number, blockIndex: number) => void;
  onUpdateTotalsBlock: (
    sectionIndex: number,
    blockIndex: number,
    update: (
      block: import('../../shared/types/layouts').TotalsRowBlock
    ) => import('../../shared/types/layouts').TotalsRowBlock
  ) => void;
  icon: (label: string, onClick: () => void, disabled: boolean, child: ReactNode) => ReactNode;
  t: (key: string) => string;
};

export const V1LayoutBuilder = ({
  sections,
  nodes,
  meta,
  dragOverNode,
  expandedNodeId,
  expandedSectionIndex,
  expandedTotalsBlock,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleNode,
  onToggleSection,
  onToggleTotalsBlock,
  onAddSection,
  onMoveSection,
  onRemoveSection,
  onAddBlock,
  onMoveBlock,
  onReparent,
  onRemoveBlock,
  onUpdateBlock,
  onUpdateSection,
  onAddTotals,
  onMoveTotals,
  onRemoveTotals,
  onUpdateTotalsBlock,
  icon,
  t
}: Props) => {
  const contains = (node: LayoutBuilderBlockNode, id: string): boolean =>
    node.id === id || node.children.some(child => contains(child, id));
  const containers = (
    blockNodes: LayoutBuilderBlockNode[],
    path: string[] = []
  ): { node: LayoutBuilderBlockNode; label: string }[] =>
    blockNodes.flatMap((node, index) => {
      const label = `${node.block.type} ${index + 1}${node.children.length ? ` (${node.children.map(child => child.block.type).join(', ')})` : ''}`;
      const next = [...path, label];
      return [
        ...(node.block.type === 'row' || node.block.type === 'column' ? [{ node, label: next.join(' > ') }] : []),
        ...containers(node.children, next)
      ];
    });
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
        onDragStart={event => onDragStart(event, 'block', node.id)}
        onDragOver={event => onDragOver(event, 'block', node.id)}
        onDrop={event => onDrop(event, 'block', node.id)}
        onDragEnd={onDragEnd}
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
          if (event.key === 'ArrowUp' && index > 0) onMoveBlock(node.id, siblings[index - 1].id);
          if (event.key === 'ArrowDown' && index < siblings.length - 1) onMoveBlock(siblings[index + 1].id, node.id);
          if (event.key === 'Delete' || event.key === 'Backspace') onRemoveBlock(node.id);
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
            () => onMoveBlock(node.id, siblings[index - 1].id),
            index <= 0,
            <KeyboardArrowUpIcon fontSize="small" />
          )}
          {icon(
            t('layouts.moveDown'),
            () => onMoveBlock(siblings[index + 1].id, node.id),
            index < 0 || index === siblings.length - 1,
            <KeyboardArrowDownIcon fontSize="small" />
          )}
          {icon(t('layouts.remove'), () => onRemoveBlock(node.id), false, <DeleteIcon fontSize="small" />)}
          {icon(t('layouts.properties'), () => onToggleNode(node.id), false, <TuneIcon fontSize="small" />)}
          <Select
            size="small"
            displayEmpty
            value=""
            onChange={event => onReparent(node.id, event.target.value)}
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
          {siblings.length > 1 && (
            <Select
              size="small"
              displayEmpty
              value=""
              onChange={event => onMoveBlock(node.id, event.target.value)}
              renderValue={() => t('layouts.moveBefore')}
              sx={{ minWidth: 112 }}
            >
              {siblings
                .filter(sibling => sibling.id !== node.id)
                .map(sibling => {
                  const siblingIndex = siblings.findIndex(item => item.id === sibling.id);
                  const label = `${sibling.block.type} ${siblingIndex + 1}${sibling.children.length ? ` (${sibling.children.map(child => child.block.type).join(', ')})` : ''}`;
                  return (
                    <MenuItem key={sibling.id} value={sibling.id}>
                      {label}
                    </MenuItem>
                  );
                })}
            </Select>
          )}
          {isContainer && (
            <Select
              size="small"
              displayEmpty
              value=""
              onChange={event => onAddBlock(sectionIndex, event.target.value as HeaderBlockType, node.id)}
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
        <V1LayoutBuilderControls
          node={node}
          expanded={expandedNodeId === node.id}
          onUpdate={change => onUpdateBlock(node.id, block => ({ ...block, ...change }))}
          t={t}
        />
        {node.children.map(child => renderBlock(child, node.children, targets, sectionIndex, depth + 1))}
      </Box>
    );
  };
  const available = getAvailableLayoutSectionTypes({ schemaVersion: 1, meta, sections });
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t('layouts.sections')}
        </Typography>
        <Select
          size="small"
          displayEmpty
          value=""
          onChange={event => onAddSection(event.target.value as LayoutSectionType)}
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
          {sections.map((section, index) => {
            const sectionNode = nodes[index];
            return (
              <Box
                key={`${section.type}-${index}`}
                role="treeitem"
                aria-level={1}
                tabIndex={0}
                draggable
                onDragStart={event => onDragStart(event, 'section', sectionNode?.id ?? '')}
                onDragOver={event => onDragOver(event, 'section', sectionNode?.id ?? '')}
                onDrop={event => onDrop(event, 'section', sectionNode?.id ?? '')}
                onDragEnd={onDragEnd}
                sx={{
                  border: '1px solid',
                  borderColor: dragOverNode === `section:${sectionNode?.id}` ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 1,
                  backgroundColor: dragOverNode === `section:${sectionNode?.id}` ? 'action.hover' : undefined
                }}
                onKeyDown={event => {
                  if (event.key === 'ArrowUp' && index > 0) {
                    event.preventDefault();
                    onMoveSection(index, index - 1);
                  }
                  if (event.key === 'ArrowDown' && index < sections.length - 1) {
                    event.preventDefault();
                    onMoveSection(index, index + 1);
                  }
                  if (event.key === 'Delete' || event.key === 'Backspace') {
                    event.preventDefault();
                    onRemoveSection(index);
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
                      () => onMoveSection(index, index - 1),
                      index === 0,
                      <KeyboardArrowUpIcon fontSize="small" />
                    )}
                    {icon(
                      t('layouts.moveDown'),
                      () => onMoveSection(index, index + 1),
                      index === sections.length - 1,
                      <KeyboardArrowDownIcon fontSize="small" />
                    )}
                    {icon(t('layouts.remove'), () => onRemoveSection(index), false, <DeleteIcon fontSize="small" />)}
                    {icon(t('layouts.properties'), () => onToggleSection(index), false, <TuneIcon fontSize="small" />)}
                  </Stack>
                </Stack>
                <V1LayoutBuilderSectionControls
                  section={section}
                  expanded={expandedSectionIndex === index}
                  onUpdate={change => onUpdateSection(index, current => ({ ...current, ...change }))}
                  t={t}
                />
                {section.type === 'header' && sectionNode && (
                  <Stack spacing={1} sx={{ mt: 1, pl: 2 }} role="group">
                    <Select
                      size="small"
                      displayEmpty
                      value=""
                      onChange={event => onAddBlock(index, event.target.value as HeaderBlockType)}
                      renderValue={() => t('layouts.addBlock')}
                    >
                      {supportedHeaderBlockTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {sectionNode.children.map(node =>
                      renderBlock(node, sectionNode.children, containers(sectionNode.children), index, 2)
                    )}
                  </Stack>
                )}
                {section.type === 'totalsRow' && (
                  <Stack spacing={1} sx={{ mt: 1, pl: 2 }} role="group">
                    <Select
                      size="small"
                      displayEmpty
                      value=""
                      onChange={event => onAddTotals(index, event.target.value as TotalsRowBlockType)}
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
                            () => onMoveTotals(index, blockIndex, blockIndex - 1),
                            blockIndex === 0,
                            <KeyboardArrowUpIcon fontSize="small" />
                          )}
                          {icon(
                            t('layouts.moveDown'),
                            () => onMoveTotals(index, blockIndex, blockIndex + 1),
                            blockIndex === (section.totalsBlocks?.length ?? 1) - 1,
                            <KeyboardArrowDownIcon fontSize="small" />
                          )}
                          {icon(
                            t('layouts.remove'),
                            () => onRemoveTotals(index, blockIndex),
                            false,
                            <DeleteIcon fontSize="small" />
                          )}
                          {block.type === 'paymentInfo' &&
                            icon(
                              t('layouts.properties'),
                              () => onToggleTotalsBlock(index, blockIndex),
                              false,
                              <TuneIcon fontSize="small" />
                            )}
                        </Stack>
                        {block.type === 'paymentInfo' && expandedTotalsBlock === `${index}:${blockIndex}` && (
                          <Select
                            size="small"
                            displayEmpty
                            value={block.paymentSource ?? ''}
                            onChange={event =>
                              onUpdateTotalsBlock(index, blockIndex, current => ({
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
            );
          })}
        </Stack>
      )}
    </>
  );
};
