import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayoutBuilder } from '../pages/layouts/LayoutBuilder';
import { parseLayoutSchema, type LayoutSchemaV2 } from '../shared/types/layouts';

const createDataTransfer = () => {
  const values = new Map<string, string>();
  return {
    effectAllowed: '',
    dropEffect: '',
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? ''
  };
};

const layout = {
  schemaVersion: 2 as const,
  meta: { name: 'V2 drag layout' },
  regions: [
    {
      id: 'left',
      width: '50%' as const,
      direction: 'column' as const,
      children: [
        { type: 'row' as const, children: [{ type: 'block' as const, block: { type: 'logo' as const } }] },
        { type: 'section' as const, section: { type: 'itemsTable' as const, visible: true } }
      ]
    },
    {
      id: 'right',
      width: '50%' as const,
      direction: 'column' as const,
      children: [
        { type: 'row' as const, children: [{ type: 'block' as const, block: { type: 'businessInfo' as const } }] }
      ]
    }
  ]
};

const renderBuilder = (value: LayoutSchemaV2 = layout) => {
  const onSchemaChange = vi.fn();
  render(<LayoutBuilder schema={JSON.stringify(value)} onSchemaChange={onSchemaChange} t={key => key} />);
  return onSchemaChange;
};

const lastSchema = (onSchemaChange: ReturnType<typeof vi.fn>) => {
  const value = onSchemaChange.mock.lastCall?.[0] as string;
  const schema = parseLayoutSchema(value).schema;
  return schema?.schemaVersion === 2 ? schema : undefined;
};

const draggableByText = (text: string) => {
  const source = screen.queryByRole('textbox', { name: text }) ?? screen.getByText(text);
  const element = source.closest('[draggable="true"]');
  expect(element).toBeTruthy();
  return element as HTMLElement;
};

describe('V2 LayoutBuilder drag and drop', () => {
  it('reorders regions through pointer drag events', () => {
    const onSchemaChange = renderBuilder();
    const left = draggableByText('left');
    const right = draggableByText('right');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(left, { dataTransfer });
    fireEvent.dragOver(right, { dataTransfer });
    fireEvent.drop(right, { dataTransfer });

    expect(lastSchema(onSchemaChange)?.schemaVersion).toBe(2);
    expect(lastSchema(onSchemaChange)?.regions.map(region => region.id)).toEqual(['right', 'left']);
  });

  it('reparents a V2 block into a row through pointer drag events', () => {
    const onSchemaChange = renderBuilder();
    const logo = draggableByText('logo');
    const rows = screen.getAllByText('row');
    const targetRow = rows[1].closest('[draggable="true"]') as HTMLElement;
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(logo, { dataTransfer });
    fireEvent.dragOver(targetRow, { dataTransfer });
    fireEvent.drop(targetRow, { dataTransfer });

    const schema = lastSchema(onSchemaChange);
    expect(schema?.schemaVersion).toBe(2);
    const rightChildren = schema?.regions[1].children;
    const rightRow = rightChildren?.[0];
    expect(rightRow?.type).toBe('row');
    if (rightRow?.type === 'row') expect(rightRow.children.map(child => child.type)).toEqual(['block', 'block']);
  });

  it('reparents a V2 block into a recursive header row through pointer drag events', () => {
    const headerLayout = {
      schemaVersion: 2 as const,
      meta: { name: 'Header drag layout' },
      regions: [
        {
          id: 'main',
          width: '100%' as const,
          direction: 'column' as const,
          children: [
            {
              type: 'section' as const,
              section: {
                type: 'header' as const,
                visible: true,
                blocks: [{ type: 'row' as const, children: [{ type: 'logo' as const }] }]
              }
            },
            { type: 'block' as const, block: { type: 'businessInfo' as const } }
          ]
        }
      ]
    };
    const onSchemaChange = renderBuilder(headerLayout);
    const businessInfo = draggableByText('businessInfo');
    const targetRow = screen.getByText('row').closest('[draggable="true"]') as HTMLElement;
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(businessInfo, { dataTransfer });
    fireEvent.dragOver(targetRow, { dataTransfer });
    fireEvent.drop(targetRow, { dataTransfer });

    const schema = lastSchema(onSchemaChange);
    const header = schema?.regions[0].children?.[0];
    expect(header?.type).toBe('section');
    if (header?.type === 'section') {
      expect(header.section.blocks?.[0]).toMatchObject({
        type: 'row',
        children: [{ type: 'logo' }, { type: 'businessInfo' }]
      });
    }
  });

  it('rejects a V2 block drop onto a leaf in another region', () => {
    const onSchemaChange = renderBuilder();
    const logo = draggableByText('logo');
    const businessInfo = draggableByText('businessInfo');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(logo, { dataTransfer });
    fireEvent.dragOver(businessInfo, { dataTransfer });
    fireEvent.drop(businessInfo, { dataTransfer });

    expect(onSchemaChange).not.toHaveBeenCalled();
  });

  it('rejects an incompatible section drop onto a recursive header row', () => {
    const headerLayout: LayoutSchemaV2 = {
      schemaVersion: 2,
      meta: { name: 'Invalid header target' },
      regions: [
        {
          id: 'main',
          width: '100%',
          direction: 'column',
          children: [
            {
              type: 'section',
              section: {
                type: 'header',
                visible: true,
                blocks: [{ type: 'row', children: [{ type: 'logo' }] }]
              }
            },
            { type: 'section', section: { type: 'itemsTable', visible: true } }
          ]
        }
      ]
    };
    const onSchemaChange = renderBuilder(headerLayout);
    const itemsTable = draggableByText('itemsTable');
    const targetRow = draggableByText('row');
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(itemsTable, { dataTransfer });
    fireEvent.dragOver(targetRow, { dataTransfer });
    fireEvent.drop(targetRow, { dataTransfer });

    expect(onSchemaChange).not.toHaveBeenCalled();
  });

  it('reparents a V2 node through the Move into menu', () => {
    const onSchemaChange = renderBuilder();
    const logoNode = screen.getByText('logo').closest('[role="treeitem"]') as HTMLElement;
    const targetRow = screen.getAllByText('row')[1].closest('[role="treeitem"]') as HTMLElement;
    const moveInto = within(logoNode).getByRole('combobox');

    fireEvent.mouseDown(moveInto);
    fireEvent.click(screen.getByText('right > row'));

    const schema = lastSchema(onSchemaChange);
    expect(schema?.regions[1].children?.[0].type).toBe('row');
    if (schema?.regions[1].children?.[0].type === 'row') {
      expect(schema.regions[1].children[0].children.map(child => child.type)).toEqual(['block', 'block']);
    }
    expect(targetRow).toBeTruthy();
  });
});
