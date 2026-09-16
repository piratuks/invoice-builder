import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LayoutBuilder } from '../pages/layouts/LayoutBuilder';
import { parseLayoutSchema } from '../shared/types/layouts';

const renderBuilder = (schema: unknown) => {
  const onSchemaChange = vi.fn();
  const onValidityChange = vi.fn();
  const rendered = render(
    <LayoutBuilder
      schema={JSON.stringify(schema)}
      onSchemaChange={onSchemaChange}
      onValidityChange={onValidityChange}
      t={key => key}
    />
  );
  return {
    onSchemaChange,
    onValidityChange,
    rerender: (nextSchema: unknown) =>
      rendered.rerender(
        <LayoutBuilder
          schema={JSON.stringify(nextSchema)}
          onSchemaChange={onSchemaChange}
          onValidityChange={onValidityChange}
          t={key => key}
        />
      )
  };
};

const latestSchema = (onSchemaChange: ReturnType<typeof vi.fn>) => {
  const value = onSchemaChange.mock.lastCall?.[0] as string;
  const schema = parseLayoutSchema(value).schema;
  return schema?.schemaVersion === 2 ? schema : undefined;
};

describe('V2 LayoutBuilder controls', () => {
  it('supports keyboard move and delete actions for V2 nodes', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'Keyboard controls' },
      regions: [
        {
          id: 'main',
          width: '100%',
          direction: 'column',
          children: [
            { type: 'block', block: { type: 'logo' } },
            { type: 'block', block: { type: 'businessInfo' } }
          ]
        }
      ]
    });
    const businessInfo = screen.getByText('businessInfo').closest('[role="treeitem"]') as HTMLElement;

    fireEvent.keyDown(businessInfo, { key: 'ArrowUp' });
    expect(
      latestSchema(view.onSchemaChange)?.regions[0].children?.map(node =>
        node.type === 'block' ? node.block.type : node.type
      )
    ).toEqual(['businessInfo', 'logo']);

    view.rerender(latestSchema(view.onSchemaChange));
    const businessAfterMove = screen.getByText('businessInfo').closest('[role="treeitem"]') as HTMLElement;
    fireEvent.keyDown(businessAfterMove, { key: 'Delete' });
    expect(latestSchema(view.onSchemaChange)?.regions[0].children).toHaveLength(1);
  });

  it('undoes and redoes a V2 mutation with toolbar buttons', () => {
    const schema = {
      schemaVersion: 2 as const,
      meta: { name: 'V2 history' },
      regions: [{ id: 'main', width: '100%' as const, direction: 'column' as const, children: [] }]
    };
    const view = renderBuilder(schema);
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByText('landscape'));
    const changed = view.onSchemaChange.mock.lastCall?.[0];

    fireEvent.click(screen.getByRole('button', { name: 'layouts.undo' }));
    expect(view.onSchemaChange).toHaveBeenLastCalledWith(JSON.stringify(schema));
    fireEvent.click(screen.getByRole('button', { name: 'layouts.redo' }));
    expect(view.onSchemaChange).toHaveBeenLastCalledWith(changed);
  });

  it('updates orientation and region width through the rendered controls', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'V2 controls' },
      regions: [
        {
          id: 'main',
          width: '50%',
          direction: 'column',
          children: [{ type: 'block', block: { type: 'logo' } }]
        },
        {
          id: 'aside',
          width: '50%',
          direction: 'column',
          sections: ['itemsTable']
        }
      ]
    });
    const comboboxes = screen.getAllByRole('combobox');

    fireEvent.mouseDown(comboboxes[0]);
    fireEvent.click(screen.getByText('landscape'));
    view.rerender(latestSchema(view.onSchemaChange));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByText('40%'));
    view.rerender(latestSchema(view.onSchemaChange));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[3]);
    fireEvent.click(screen.getByText('10'));

    const schema = latestSchema(view.onSchemaChange);
    expect(schema?.schemaVersion).toBe(2);
    expect(schema?.orientation).toBe('landscape');
    expect(schema?.regions[0].width).toBe('40%');
    expect(schema?.regions[0].gap).toBe(10);
  });

  it('upgrades a V1 layout and shows the upgrade notice', () => {
    const view = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Legacy layout' },
      sections: [{ type: 'header', visible: true }]
    });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByText('landscape'));

    const schema = latestSchema(view.onSchemaChange);
    expect(schema?.schemaVersion).toBe(2);
    expect(schema?.orientation).toBe('landscape');
    expect(schema?.regions).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('layouts.upgradedToV2');
    expect(screen.getByRole('alert')).toHaveTextContent('layouts.upgradedToV2Details');
  });

  it('upgrades V1 when selecting Add region from the V2 feature menu', () => {
    const view = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'V2 capability upgrade' },
      sections: [{ type: 'header', visible: true }]
    });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByText('layouts.addRegion'));
    const withRegion = latestSchema(view.onSchemaChange);
    expect(withRegion?.schemaVersion).toBe(2);
    expect(withRegion?.regions).toHaveLength(2);
  });

  it('dismisses the upgrade notice after four seconds', () => {
    vi.useFakeTimers();
    try {
      renderBuilder({
        schemaVersion: 1,
        meta: { name: 'Temporary notice' },
        sections: [{ type: 'header', visible: true }]
      });

      fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
      fireEvent.click(screen.getByText('landscape'));
      expect(screen.getByRole('alert')).toBeTruthy();

      act(() => vi.advanceTimersByTime(4000));
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('updates justify and block display properties through the controls', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'Block properties' },
      regions: [
        {
          id: 'main',
          width: '100%',
          direction: 'column',
          children: [{ type: 'block', block: { type: 'logo' } }]
        }
      ]
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'layouts.properties' })[0]);

    const choose = (index: number, option: string) => {
      const blockNode = screen.getByText('logo').closest('[role="treeitem"]') as HTMLElement;
      fireEvent.mouseDown(within(blockNode).getAllByRole('combobox')[index - 1]);
      const options = screen.getAllByText(option);
      fireEvent.click(options[options.length - 1]);
      view.rerender(latestSchema(view.onSchemaChange));
    };

    choose(8, 'between');
    choose(9, 'layouts.enabled');
    choose(10, 'layouts.enabled');
    choose(11, 'layouts.enabled');

    const block = latestSchema(view.onSchemaChange)?.regions[0].children?.[0];
    expect(block?.type).toBe('block');
    if (block?.type === 'block') {
      expect(block.block).toMatchObject({
        justify: 'between',
        boxed: true,
        showTitle: true,
        showInvoiceLabel: true
      });
    }
  });

  it('updates V2 container width and gap properties', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'Container properties' },
      regions: [
        {
          id: 'main',
          width: '100%',
          direction: 'column',
          children: [{ type: 'row', children: [{ type: 'block', block: { type: 'logo' } }] }]
        }
      ]
    });
    const row = screen.getByText('row').closest('[role="treeitem"]') as HTMLElement;
    fireEvent.click(within(row).getAllByRole('button', { name: 'layouts.properties' })[0]);
    const controls = within(row).getAllByRole('combobox');

    fireEvent.mouseDown(controls[1]);
    fireEvent.click(screen.getByText('50%'));
    view.rerender(latestSchema(view.onSchemaChange));
    fireEvent.mouseDown(
      within(screen.getByText('row').closest('[role="treeitem"]') as HTMLElement).getAllByRole('combobox')[2]
    );
    fireEvent.click(screen.getByText('10'));

    const rowSchema = latestSchema(view.onSchemaChange)?.regions[0].children?.[0];
    expect(rowSchema).toMatchObject({ type: 'row', width: '50%', gap: 10 });
  });

  it('renames a region inline on blur', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'Rename region' },
      regions: [{ id: 'main', width: '100%', direction: 'column', children: [] }]
    });
    const nameField = screen.getByRole('textbox', { name: 'main' });

    fireEvent.change(nameField, { target: { value: 'content' } });
    fireEvent.blur(nameField);

    expect(latestSchema(view.onSchemaChange)?.regions[0].id).toBe('content');
  });

  it('shows an error and reports invalid when region IDs are duplicated', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'Duplicate region' },
      regions: [
        { id: 'main', width: '50%', direction: 'column', children: [] },
        { id: 'content', width: '50%', direction: 'column', children: [] }
      ]
    });
    const contentField = screen.getByRole('textbox', { name: 'content' });

    fireEvent.change(contentField, { target: { value: 'main' } });

    expect(screen.getAllByText('layouts.uniqueRegionId')).not.toHaveLength(0);
    expect(view.onValidityChange).toHaveBeenLastCalledWith(false);
    expect(view.onSchemaChange).not.toHaveBeenCalled();
  });

  it('keeps the V2 builder when adding a section node', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'Add V2 section' },
      regions: [{ id: 'main', width: '100%', direction: 'column', children: [{ type: 'row', children: [] }] }]
    });
    const rowNode = screen.getByText('row').closest('[role="treeitem"]') as HTMLElement;
    fireEvent.mouseDown(within(rowNode).getAllByRole('combobox').at(-1)!);
    fireEvent.click(screen.getByText('itemsTable'));

    const schema = latestSchema(view.onSchemaChange);
    expect(schema?.schemaVersion).toBe(2);
    const row = schema?.regions[0].children?.[0];
    expect(row?.type).toBe('row');
    if (row?.type === 'row') expect(row.children.some(node => node.type === 'section')).toBe(true);
    expect(screen.getByText('V2')).toBeTruthy();
  });

  it('keeps V2 after upgrading a V1 layout and adding a section node', () => {
    const view = renderBuilder({
      schemaVersion: 1,
      meta: { name: 'Upgrade then add section' },
      sections: [{ type: 'header', visible: true }]
    });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByText('landscape'));
    view.rerender(latestSchema(view.onSchemaChange));

    fireEvent.mouseDown(screen.getAllByRole('combobox').at(-1)!);
    fireEvent.click(screen.getByText('itemsTable'));

    expect(latestSchema(view.onSchemaChange)?.schemaVersion).toBe(2);
    expect(screen.getByText('V2')).toBeTruthy();
  });

  it('shows and uses Add node for imported flat V2 regions', () => {
    const view = renderBuilder({
      schemaVersion: 2,
      meta: { name: 'Flat region editing' },
      regions: [{ id: 'main', width: '100%', direction: 'column', sections: ['itemsTable'] }]
    });

    fireEvent.mouseDown(screen.getAllByRole('combobox').at(-1)!);
    fireEvent.click(screen.getByText('notes'));

    const schema = latestSchema(view.onSchemaChange);
    expect(schema?.regions[0].children?.map(node => node.type)).toEqual(['section', 'section']);
    expect(schema?.regions[0].sections).toBeUndefined();
  });
});
