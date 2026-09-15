import { describe, expect, it } from 'vitest';
import { parseLayoutSchema } from '../shared/types/layouts';
import {
  addLayoutBuilderV2Node,
  addLayoutBuilderV2Region,
  createLayoutBuilderV2State,
  moveLayoutBuilderV2Node,
  renameLayoutBuilderV2Region,
  reparentLayoutBuilderV2Node,
  reparentLayoutBuilderV2NodeToRegion,
  serializeLayoutBuilderV2State,
  setLayoutBuilderV2Orientation,
  updateLayoutBuilderV2Node,
  updateLayoutBuilderV2Region,
  upgradeLayoutToV2
} from '../shared/utils/visualBuilder';

const layout = {
  schemaVersion: 2 as const,
  meta: { name: 'V2 visual layout' },
  orientation: 'landscape' as const,
  regions: [
    {
      id: 'header',
      width: '30%' as const,
      direction: 'column' as const,
      blocks: [{ type: 'logo' as const }, { type: 'businessInfo' as const }]
    },
    {
      id: 'body',
      width: '70%' as const,
      direction: 'column' as const,
      overflow: 'keepTogether' as const,
      children: [
        {
          type: 'row' as const,
          gap: 10 as const,
          children: [
            { type: 'block' as const, block: { type: 'clientInfo' as const } },
            { type: 'section' as const, section: { type: 'itemsTable' as const, visible: true } }
          ]
        }
      ]
    }
  ]
};

describe('V2 visual builder', () => {
  it('round-trips block, section, and recursive child region content', () => {
    const state = createLayoutBuilderV2State(layout);
    const serialized = serializeLayoutBuilderV2State(state);

    expect(serialized).toEqual(layout);
    expect(parseLayoutSchema(JSON.stringify(serialized)).errors).toEqual([]);
  });

  it('updates orientation, region settings, and adds regions', () => {
    const landscape = setLayoutBuilderV2Orientation(layout, 'portrait');
    const updated = updateLayoutBuilderV2Region(landscape, 'body', {
      width: '50%',
      direction: 'grid',
      overflow: 'continue'
    });
    const withRegion = addLayoutBuilderV2Region(updated);

    expect(withRegion.orientation).toBe('portrait');
    expect(withRegion.regions[1]).toMatchObject({ width: '50%', direction: 'grid', overflow: 'continue' });
    expect(withRegion.regions).toHaveLength(3);
    expect(parseLayoutSchema(JSON.stringify(withRegion)).errors).toEqual([]);
  });

  it('splits a full-width region when adding a new region', () => {
    const withRegion = addLayoutBuilderV2Region({
      schemaVersion: 2,
      meta: { name: 'Full-width layout' },
      regions: [{ id: 'main', width: '100%', direction: 'column', children: [] }]
    });

    expect(withRegion.regions.map(region => region.width)).toEqual(['80%', '20%']);
    expect(withRegion.regions[1].id).toBe('region-1');
    expect(parseLayoutSchema(JSON.stringify(withRegion)).errors).toEqual([]);
  });

  it('uses a generated ID when adding beside a non-main region', () => {
    const withRegion = addLayoutBuilderV2Region({
      schemaVersion: 2,
      meta: { name: 'Named region layout' },
      regions: [{ id: 'sidebar', width: '80%', direction: 'column', children: [] }]
    });

    expect(withRegion.regions.at(-1)?.id).toBe('region-1');
    expect(parseLayoutSchema(JSON.stringify(withRegion)).errors).toEqual([]);
  });

  it('renames regions while preserving unique valid IDs', () => {
    const renamed = renameLayoutBuilderV2Region(layout, 'body', 'content');
    const duplicate = renameLayoutBuilderV2Region(renamed, 'content', 'header');
    const empty = renameLayoutBuilderV2Region(renamed, 'content', '   ');

    expect(renamed.regions[1].id).toBe('content');
    expect(duplicate.regions[1].id).toBe('content');
    expect(empty.regions[1].id).toBe('content');
    expect(parseLayoutSchema(JSON.stringify(renamed)).errors).toEqual([]);
  });

  it('promotes flat region content when adding a recursive V2 node', () => {
    const withChild = addLayoutBuilderV2Node(layout, 'header', undefined, 'row');

    expect(withChild.regions[0].children?.map(node => node.type)).toEqual(['block', 'block', 'row']);
    expect(parseLayoutSchema(JSON.stringify(withChild)).errors).toEqual([]);
  });

  it('rejects region width updates that exceed the page width', () => {
    const unchanged = updateLayoutBuilderV2Region(layout, 'body', { width: '80%' });

    expect(unchanged.regions[1].width).toBe('70%');
    expect(parseLayoutSchema(JSON.stringify(unchanged)).errors).toEqual([]);
  });

  it('adds, reorders, and reparents V2 nodes without invalid serialization', () => {
    const withRow = addLayoutBuilderV2Node(layout, 'body', undefined, 'row');
    const state = createLayoutBuilderV2State(withRow);
    const rowId = state.regions[1].children[1].id;
    const firstNodeId = state.regions[1].children[0].id;
    const moved = moveLayoutBuilderV2Node(withRow, firstNodeId, rowId);
    const movedState = createLayoutBuilderV2State(moved);
    const targetRowId = movedState.regions[1].children[1].id;
    const blockId = movedState.regions[1].children[0].id;
    const reparented = reparentLayoutBuilderV2Node(moved, blockId, targetRowId);

    expect(parseLayoutSchema(JSON.stringify(reparented)).errors).toEqual([]);
    expect(reparented.regions[1].children?.some(node => node.type === 'row')).toBe(true);
  });

  it('does not add a duplicate V2 section type', () => {
    const unchanged = addLayoutBuilderV2Node(layout, 'body', undefined, 'section');

    expect(unchanged).toEqual(layout);
    expect(parseLayoutSchema(JSON.stringify(unchanged)).errors).toEqual([]);
  });

  it('preserves flat region content when rejecting a duplicate section', () => {
    const flatLayout = {
      schemaVersion: 2 as const,
      meta: { name: 'Flat sections' },
      regions: [{ id: 'main', width: '100%' as const, direction: 'column' as const, sections: ['itemsTable' as const] }]
    };
    const unchanged = addLayoutBuilderV2Node(flatLayout, 'main', undefined, 'section', 'itemsTable');

    expect(unchanged).toEqual(flatLayout);
    expect(unchanged.regions[0].sections).toEqual(['itemsTable']);
    expect(unchanged.regions[0].children).toBeUndefined();
  });

  it('preserves edited properties when promoting a flat section region', () => {
    const flatLayout = {
      schemaVersion: 2 as const,
      meta: { name: 'Editable flat section' },
      regions: [{ id: 'main', width: '100%' as const, direction: 'column' as const, sections: ['itemsTable' as const] }]
    };
    const state = createLayoutBuilderV2State(flatLayout);
    const sectionId = state.regions[0].children[0].id;
    const updated = updateLayoutBuilderV2Node(flatLayout, sectionId, node =>
      node.type === 'section'
        ? { ...node, section: { ...node.section, visible: false, columnSizing: 'proportional' } }
        : node
    );

    expect(updated.regions[0].sections).toBeUndefined();
    expect(updated.regions[0].children?.[0]).toMatchObject({
      type: 'section',
      section: { type: 'itemsTable', visible: false, columnSizing: 'proportional' }
    });
    expect(parseLayoutSchema(JSON.stringify(updated)).errors).toEqual([]);
  });

  it('adds the requested V2 section type explicitly', () => {
    const withNotes = addLayoutBuilderV2Node(layout, 'body', undefined, 'section', 'notes');

    expect(withNotes.regions[1].children?.at(-1)).toMatchObject({
      type: 'section',
      section: { type: 'notes', visible: true }
    });
    expect(parseLayoutSchema(JSON.stringify(withNotes)).errors).toEqual([]);
  });

  it('allocates deterministic unique IDs for repeated V2 node additions', () => {
    const first = addLayoutBuilderV2Node(layout, 'body', undefined, 'row');
    const second = addLayoutBuilderV2Node(first, 'body', undefined, 'column');

    const state = createLayoutBuilderV2State(second);
    expect(state.regions[1].children).toHaveLength(3);
    expect(new Set(state.regions[1].children.map(node => node.id)).size).toBe(3);
    expect(parseLayoutSchema(JSON.stringify(second)).errors).toEqual([]);
  });

  it('promotes a flat blocks region before root reparenting', () => {
    const flatBlocks = {
      schemaVersion: 2 as const,
      meta: { name: 'Flat blocks' },
      regions: [
        {
          id: 'source',
          width: '50%' as const,
          direction: 'column' as const,
          children: [{ type: 'row' as const, children: [{ type: 'block' as const, block: { type: 'logo' as const } }] }]
        },
        {
          id: 'target',
          width: '50%' as const,
          direction: 'column' as const,
          blocks: [{ type: 'businessInfo' as const }]
        }
      ]
    };
    const state = createLayoutBuilderV2State(flatBlocks);
    const logoId = state.regions[0].children[0].children[0].id;
    const moved = reparentLayoutBuilderV2NodeToRegion(flatBlocks, logoId, 'target');

    expect(moved.regions[1].blocks).toBeUndefined();
    expect(moved.regions[1].children?.map(node => node.type)).toEqual(['block', 'block']);
    expect(parseLayoutSchema(JSON.stringify(moved)).errors).toEqual([]);
  });

  it('upgrades a V1 layout into a valid V2 region composition', () => {
    const upgraded = upgradeLayoutToV2({
      schemaVersion: 1,
      meta: { name: 'Legacy layout' },
      sections: [
        { type: 'header', visible: true },
        { type: 'itemsTable', visible: true }
      ]
    });

    expect(upgraded.regions[0]).toMatchObject({ id: 'main', width: '100%', direction: 'column' });
    expect(parseLayoutSchema(JSON.stringify(upgraded)).errors).toEqual([]);
  });

  it('applies V2 grid and overflow capabilities after a V1 upgrade', () => {
    const upgraded = upgradeLayoutToV2({
      schemaVersion: 1,
      meta: { name: 'Capability layout' },
      sections: [{ type: 'header', visible: true }]
    });
    const withGrid = addLayoutBuilderV2Node(upgraded, 'main', undefined, 'grid');
    const withOverflow = updateLayoutBuilderV2Region(withGrid, 'main', { overflow: 'keepTogether' });

    expect(withOverflow.schemaVersion).toBe(2);
    expect(withOverflow.regions[0].overflow).toBe('keepTogether');
    expect(withOverflow.regions[0].children?.some(node => node.type === 'grid')).toBe(true);
    expect(parseLayoutSchema(JSON.stringify(withOverflow)).errors).toEqual([]);
  });
});
