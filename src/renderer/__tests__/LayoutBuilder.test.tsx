import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayoutBuilder } from '../pages/layouts/LayoutBuilder';
import { parseLayoutSchema } from '../shared/types/layouts';

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
