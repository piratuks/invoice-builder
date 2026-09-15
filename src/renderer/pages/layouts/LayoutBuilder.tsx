import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, IconButton, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { useMemo, type ReactNode } from 'react';
import {
  parseLayoutSchema,
  type HeaderBlockType,
  type LayoutSchemaAny,
  type LayoutSectionType,
  type TotalsRowBlockType
} from '../../shared/types/layouts';
import {
  addHeaderBlock,
  addLayoutSection,
  addTotalsRowBlock,
  createLayoutBuilderState,
  getAvailableLayoutSectionTypes,
  moveBuilderNode,
  moveLayoutSection,
  moveTotalsRowBlock,
  removeBuilderNode,
  removeLayoutSection,
  removeTotalsRowBlock,
  reparentBuilderNode,
  supportedHeaderBlockTypes,
  supportedLayoutSectionTypes,
  supportedTotalsRowBlockTypes,
  type LayoutBuilderBlockNode
} from './../../shared/utils/visualBuilder';

export const LayoutBuilder = ({
  schema,
  onSchemaChange,
  t
}: {
  schema: string;
  onSchemaChange: (schema: string) => void;
  t: (key: string) => string;
}) => {
  const builderState = useMemo(() => {
    const parsed = parseLayoutSchema(schema);
    return parsed.errors.length || !parsed.schema || parsed.schema.schemaVersion !== 1
      ? undefined
      : createLayoutBuilderState(parsed.schema);
  }, [schema]);
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
    addTotals: (a: number, type: TotalsRowBlockType) => apply(current => addTotalsRowBlock(current, a, type)),
    moveTotals: (a: number, b: number, c: number) => apply(current => moveTotalsRowBlock(current, a, b, c)),
    removeTotals: (a: number, b: number) => apply(current => removeTotalsRowBlock(current, a, b))
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
  const icon = (label: string, onClick: () => void, disabled = false, child: ReactNode) => (
    <Tooltip title={label}>
      <span>
        <IconButton size="small" aria-label={label} disabled={disabled} onClick={onClick}>
          {child}
        </IconButton>
      </span>
    </Tooltip>
  );
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
        sx={{ pl: 2, ml: 1, py: 0.5, borderLeft: '2px solid', borderColor: 'divider' }}
        onKeyDown={event => {
          if (event.key === 'ArrowUp' && index > 0) actions.moveBlock(node.id, siblings[index - 1].id);
          if (event.key === 'ArrowDown' && index < siblings.length - 1)
            actions.moveBlock(node.id, siblings[index + 1].id);
          if (event.key === 'Delete' || event.key === 'Backspace') actions.removeBlock(node.id);
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
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
            () => actions.moveBlock(node.id, siblings[index + 1].id),
            index < 0 || index === siblings.length - 1,
            <KeyboardArrowDownIcon fontSize="small" />
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
          {icon(t('layouts.remove'), () => actions.removeBlock(node.id), false, <DeleteIcon fontSize="small" />)}
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
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.25 }}
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
                  <Typography sx={{ fontWeight: 600 }}>{section.type}</Typography>
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
                  </Stack>
                </Stack>
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
                      <Stack
                        key={`${block.type}-${blockIndex}`}
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: 'center' }}
                      >
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
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};
