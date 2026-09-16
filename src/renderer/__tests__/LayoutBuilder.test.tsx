import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayoutBuilder } from '../pages/layouts/LayoutBuilder';
import { parseLayoutSchema } from '../shared/types/layouts';
import {
  addHeaderBlock,
  createLayoutBuilderState,
  moveBuilderNode,
  moveLayoutSection
} from '../shared/utils/visualBuilderV1';

const createDataTransfer = () => {
  const values = new Map<string, string>();
  return {
    effectAllowed: '',
    dropEffect: '',
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? ''
  };
};

const renderBuilder = (schema: unknown) => {
  const onSchemaChange = vi.fn();
  render(<LayoutBuilder schema={JSON.stringify(schema)} onSchemaChange={onSchemaChange} t={key => key} />);
  return onSchemaChange;
};

const changedSchema = (onSchemaChange: ReturnType<typeof vi.fn>) => {
  const value = onSchemaChange.mock.lastCall?.[0];
  expect(value).toEqual(expect.any(String));
  const schema = parseLayoutSchema(value as string).schema;
  return schema?.schemaVersion === 1 ? schema : undefined;
};

describe('LayoutBuilder drag and drop', () => {
  it('undoes and redoes a V1 mutation with keyboard shortcuts', () => {
    const schema = {
      schemaVersion: 1 as const,
      meta: { name: 'V1 history' },
      sections: [{ type: 'financialTotals' as const, visible: true }]
    };
    const onSchemaChange = renderBuilder(schema);
    const section = screen.getByText('financialTotals').closest('[role="treeitem"]') as HTMLElement;
    fireEvent.click(within(section).getByRole('button', { name: 'layouts.properties' }));
    const controls = within(section).getAllByRole('combobox');
    fireEvent.mouseDown(controls[1]);
    fireEvent.click(screen.getByText('start'));
    const changed = onSchemaChange.mock.lastCall?.[0];

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(onSchemaChange).toHaveBeenLastCalledWith(JSON.stringify(schema));
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(onSchemaChange).toHaveBeenLastCalledWith(changed);
  });

  it('keeps distinct V1 block IDs stable when siblings are reordered', () => {
    const schema = {
      schemaVersion: 1 as const,
      meta: { name: 'Stable block IDs' },
      sections: [
        { type: 'header' as const, visible: true, blocks: [{ type: 'title' as const }, { type: 'logo' as const }] }
      ]
    };
    const initialState = createLayoutBuilderState(schema);
    const titleId = initialState.nodes[0].children[0].id;
    const logoId = initialState.nodes[0].children[1].id;
    const reordered = moveBuilderNode(schema, logoId, titleId);
    const reorderedState = createLayoutBuilderState(reordered);

    expect(reorderedState.nodes[0].children.map(node => node.id)).toEqual([logoId, titleId]);
  });

  it('uses deterministic IDs when adding V1 header blocks', () => {
    const schema = {
      schemaVersion: 1 as const,
      meta: { name: 'Added block IDs' },
      sections: [{ type: 'header' as const, visible: true, blocks: [{ type: 'title' as const }] }]
    };
    const updated = addHeaderBlock(schema, 0, 'logo');
    const state = createLayoutBuilderState(updated);

    expect(state.nodes[0].children[1].id).toMatch(/^header-block-[a-z0-9]+-0$/);
    expect(state.nodes[0].children[1].id).not.toContain('-new-');
  });

  it('keeps V1 section IDs stable when sections are reordered', () => {
    const schema = {
      schemaVersion: 1 as const,
      meta: { name: 'Stable section IDs' },
      sections: [
        { type: 'header' as const, visible: true },
        { type: 'itemsTable' as const, visible: true }
      ]
    };
    const initialState = createLayoutBuilderState(schema);
    const headerId = initialState.nodes[0].id;
    const itemsId = initialState.nodes[1].id;
    const reordered = moveLayoutSection(schema, 1, 0);
    const reorderedState = createLayoutBuilderState(reordered);

    expect(reorderedState.nodes.map(node => node.id)).toEqual([itemsId, headerId]);
  });

  it('edits V1 section alignment through Properties', () => {
    const onSchemaChange = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Section alignment' },
      sections: [{ type: 'financialTotals', visible: true }]
    });

    const section = screen.getByText('financialTotals').closest('[role="treeitem"]') as HTMLElement;
    fireEvent.click(within(section).getByRole('button', { name: 'layouts.properties' }));
    const controls = within(section).getAllByRole('combobox');
    fireEvent.mouseDown(controls[1]);
    fireEvent.click(screen.getByText('start'));

    expect(changedSchema(onSchemaChange)?.sections?.[0]).toMatchObject({ type: 'financialTotals', align: 'start' });
  });

  it('reorders sections through pointer drag events', () => {
    const onSchemaChange = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Drag sections' },
      sections: [
        { type: 'header', visible: true },
        { type: 'itemsTable', visible: true }
      ]
    });
    const [header, items] = screen.getAllByRole('treeitem');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(header, { dataTransfer });
    fireEvent.dragOver(items, { dataTransfer });
    fireEvent.drop(items, { dataTransfer });

    expect(changedSchema(onSchemaChange)?.sections?.map(section => section.type)).toEqual(['itemsTable', 'header']);
  });

  it('reorders sibling containers through pointer drag events', () => {
    const onSchemaChange = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Drag containers' },
      sections: [
        {
          type: 'header',
          visible: true,
          blocks: [
            { type: 'row', children: [{ type: 'logo' }] },
            { type: 'column', children: [{ type: 'businessInfo' }] }
          ]
        }
      ]
    });
    const [, row, , column] = screen.getAllByRole('treeitem');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(row, { dataTransfer });
    fireEvent.dragOver(column, { dataTransfer });
    fireEvent.drop(column, { dataTransfer });

    expect(changedSchema(onSchemaChange)?.sections?.[0].blocks?.map(block => block.type)).toEqual(['column', 'row']);
  });

  it('reparents a block into a container through pointer drag events', () => {
    const onSchemaChange = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Drag into container' },
      sections: [
        {
          type: 'header',
          visible: true,
          blocks: [{ type: 'row', children: [{ type: 'title' }] }, { type: 'logo' }]
        }
      ]
    });
    const [, row, , logo] = screen.getAllByRole('treeitem');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(logo, { dataTransfer });
    fireEvent.dragOver(row, { dataTransfer });
    fireEvent.drop(row, { dataTransfer });

    const header = changedSchema(onSchemaChange)?.sections?.[0];
    expect(header?.blocks).toHaveLength(1);
    expect(header?.blocks?.[0].children?.map(block => block.type)).toEqual(['title', 'logo']);
  });

  it('moves a V1 block before an arbitrary sibling through the menu', () => {
    const onSchemaChange = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Menu sibling reorder' },
      sections: [
        {
          type: 'header',
          visible: true,
          blocks: [{ type: 'row', children: [{ type: 'title' }, { type: 'logo' }, { type: 'businessInfo' }] }]
        }
      ]
    });
    const [, row, , , businessInfo] = screen.getAllByRole('treeitem');
    const moveBefore = within(businessInfo).getAllByRole('combobox')[1];

    fireEvent.mouseDown(moveBefore);
    fireEvent.click(screen.getAllByRole('option').find(option => option.textContent === 'title 1') as HTMLElement);

    const header = changedSchema(onSchemaChange)?.sections?.[0];
    expect(header?.blocks?.[0].children?.map(block => block.type)).toEqual(['businessInfo', 'title', 'logo']);
    expect(row).toBeTruthy();
  });

  it('does not accept a block drop onto a leaf in another parent', () => {
    const onSchemaChange = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Reject invalid drop' },
      sections: [
        {
          type: 'header',
          visible: true,
          blocks: [
            { type: 'row', children: [{ type: 'logo' }] },
            { type: 'column', children: [{ type: 'businessInfo' }] }
          ]
        }
      ]
    });
    const [, row, logo, column, businessInfo] = screen.getAllByRole('treeitem');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(logo, { dataTransfer });
    fireEvent.dragOver(businessInfo, { dataTransfer });
    fireEvent.drop(businessInfo, { dataTransfer });

    expect(onSchemaChange).not.toHaveBeenCalled();
    expect(row).toBeTruthy();
    expect(column).toBeTruthy();
  });
});
