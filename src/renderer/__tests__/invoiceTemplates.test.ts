import { describe, expect, it } from 'vitest';
import { parseLayoutSchema, validHeaderBlockTypes, validTotalsRowBlockTypes } from '../shared/types/layouts';
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
  reparentLayoutSection,
  supportedHeaderBlockTypes,
  supportedTotalsRowBlockTypes,
  updateLayoutSection,
  updateTotalsRowBlock,
  type LayoutVisualBuilderSection
} from '../shared/utils/visualBuilderV1';

const valid = JSON.stringify({
  schemaVersion: 1,
  meta: { name: 'Receipt' },
  sections: [{ type: 'header', visible: true }]
});

const validV2 = JSON.stringify({
  schemaVersion: 2,
  meta: { name: 'Sidebar invoice' },
  orientation: 'landscape',
  regions: [
    {
      id: 'sidebar',
      width: '30%',
      direction: 'column',
      blocks: [{ type: 'row', children: [{ type: 'logo' }, { type: 'businessInfo' }] }]
    },
    { id: 'main', width: '70%', direction: 'column', sections: ['itemsTable', 'financialTotals'] }
  ]
});

describe('invoice template schema', () => {
  it('supports v1 visual section add, reorder, and removal without breaking schema validation', () => {
    const schema = {
      schemaVersion: 1,
      meta: { name: 'Visual layout' },
      sections: [
        { type: 'header', visible: true },
        { type: 'itemsTable', visible: true }
      ]
    } satisfies LayoutVisualBuilderSection;

    const added = addLayoutSection(schema, 'totalsRow');
    expect(added.sections?.map((section: { type: string }) => section.type)).toEqual([
      'header',
      'itemsTable',
      'totalsRow'
    ]);

    const moved = moveLayoutSection(added, 2, 0);
    expect(moved.sections?.map((section: { type: string }) => section.type)).toEqual([
      'totalsRow',
      'header',
      'itemsTable'
    ]);

    const reparented = reparentLayoutSection(moved, 0, 2);
    expect(reparented.sections?.map((section: { type: string }) => section.type)).toEqual([
      'header',
      'itemsTable',
      'totalsRow'
    ]);

    const removed = removeLayoutSection(reparented, 1);
    expect(removed.sections?.map((section: { type: string }) => section.type)).toEqual(['header', 'totalsRow']);
    expect(parseLayoutSchema(JSON.stringify(removed)).errors).toEqual([]);
  });

  it('supports node-level reorder and true header-block reparenting', () => {
    const schema = {
      schemaVersion: 1,
      meta: { name: 'Node tree' },
      sections: [
        {
          type: 'header',
          visible: true,
          blocks: [{ type: 'row', children: [{ type: 'logo' }] }, { type: 'clientInfo' }]
        },
        { type: 'itemsTable', visible: true },
        { type: 'totalsRow', visible: true }
      ]
    } satisfies LayoutVisualBuilderSection;

    const headerId = createLayoutBuilderState(schema).nodes[0].id;
    const totalsId = createLayoutBuilderState(schema).nodes[2].id;
    const moved = moveBuilderNode(schema, headerId, totalsId);
    expect(moved.sections.map((section: { type: string }) => section.type)).toEqual([
      'itemsTable',
      'header',
      'totalsRow'
    ]);

    const nextState = createLayoutBuilderState(moved);
    const headerNode = nextState.nodes.find(node => node.section.type === 'header');
    expect(headerNode).toBeDefined();
    const rowNode = headerNode?.children[0];
    const clientNode = headerNode?.children[1];
    expect(rowNode?.block.type).toBe('row');
    expect(clientNode?.block.type).toBe('clientInfo');

    const reparented = reparentBuilderNode(moved, clientNode?.id ?? '', rowNode?.id ?? '');
    const header = reparented.sections.find(section => section.type === 'header');
    expect(header?.blocks?.[0].children?.map(block => block.type)).toEqual(['logo', 'clientInfo']);
    expect(parseLayoutSchema(JSON.stringify(reparented)).errors).toEqual([]);
  });

  it('derives V1 block palettes from the validator and supports block mutations', () => {
    expect(supportedHeaderBlockTypes).toEqual(validHeaderBlockTypes);
    expect(supportedTotalsRowBlockTypes).toEqual(validTotalsRowBlockTypes);

    const schema = {
      schemaVersion: 1,
      meta: { name: 'Block palette' },
      sections: [
        { type: 'header', visible: true, blocks: [{ type: 'row' }] },
        { type: 'totalsRow', visible: true }
      ]
    } satisfies LayoutVisualBuilderSection;

    const withHeaderBlock = addHeaderBlock(schema, 0, 'logo');
    expect(withHeaderBlock.sections?.[0].blocks?.map(block => block.type)).toEqual(['row', 'logo']);

    const rowId = createLayoutBuilderState(withHeaderBlock).nodes[0].children[0].id;
    const withNestedBlock = addHeaderBlock(withHeaderBlock, 0, 'clientInfo', rowId);
    const nestedState = createLayoutBuilderState(withNestedBlock);
    expect(nestedState.nodes[0].children[0].children[0].block.type).toBe('clientInfo');

    const withTotalsBlock = addTotalsRowBlock(withNestedBlock, 1, 'financialTotals');
    expect(withTotalsBlock.sections?.[1].totalsBlocks?.[0].type).toBe('financialTotals');
    const withSecondTotalsBlock = addTotalsRowBlock(withTotalsBlock, 1, 'paymentInfo');
    const movedTotals = moveTotalsRowBlock(withSecondTotalsBlock, 1, 1, 0);
    expect(movedTotals.sections?.[1].totalsBlocks?.map(block => block.type)).toEqual([
      'paymentInfo',
      'financialTotals'
    ]);
    const removedTotals = removeTotalsRowBlock(movedTotals, 1, 0);
    expect(removedTotals.sections?.[1].totalsBlocks?.map(block => block.type)).toEqual(['financialTotals']);

    const nestedBlockId = createLayoutBuilderState(removedTotals).nodes[0].children[0].children[0].id;
    const removed = removeBuilderNode(removedTotals, nestedBlockId);
    expect(removed.sections?.[0].blocks?.[0].children).toEqual([]);
    expect(parseLayoutSchema(JSON.stringify(removed)).errors).toEqual([]);
  });

  it('updates V1 section properties and totals payment source', () => {
    const schema = {
      schemaVersion: 1,
      meta: { name: 'Section properties' },
      sections: [
        { type: 'watermark', visible: true },
        { type: 'itemsTable', visible: true },
        { type: 'totalsRow', visible: true, totalsBlocks: [{ type: 'paymentInfo' }] }
      ]
    } satisfies LayoutVisualBuilderSection;
    const updated = updateLayoutSection(schema, 0, section => ({
      ...section,
      visible: 'auto',
      watermarkOrder: 'paidFirst'
    }));
    const sized = updateLayoutSection(updated, 1, section => ({ ...section, columnSizing: 'proportional' }));
    const withPaymentSource = updateTotalsRowBlock(sized, 2, 0, block => ({
      ...block,
      paymentSource: 'legacyBusiness'
    }));

    expect(withPaymentSource.sections?.[0]).toMatchObject({ visible: 'auto', watermarkOrder: 'paidFirst' });
    expect(withPaymentSource.sections?.[1]).toMatchObject({ columnSizing: 'proportional' });
    expect(withPaymentSource.sections?.[2].totalsBlocks?.[0].paymentSource).toBe('legacyBusiness');
    expect(parseLayoutSchema(JSON.stringify(withPaymentSource)).errors).toEqual([]);
  });

  it('rejects invalid block reparenting without changing the layout', () => {
    const schema = {
      schemaVersion: 1,
      meta: { name: 'Invalid moves' },
      sections: [
        {
          type: 'header',
          visible: true,
          blocks: [
            { type: 'row', children: [{ type: 'column', children: [{ type: 'logo' }] }] },
            { type: 'businessInfo' }
          ]
        }
      ]
    } satisfies LayoutVisualBuilderSection;
    const state = createLayoutBuilderState(schema);
    const rowId = state.nodes[0].children[0].id;
    const columnId = state.nodes[0].children[0].children[0].id;
    const logoId = state.nodes[0].children[0].children[0].children[0].id;
    const leafId = state.nodes[0].children[1].id;

    expect(reparentBuilderNode(schema, logoId, logoId)).toEqual(schema);
    expect(reparentBuilderNode(schema, logoId, leafId)).toEqual(schema);
    expect(reparentBuilderNode(schema, rowId, columnId)).toEqual(schema);
  });

  it('accepts a strict valid v1 template', () => expect(parseLayoutSchema(valid).errors).toEqual([]));
  it('accepts a valid v2 template with independent regions', () => {
    const result = parseLayoutSchema(validV2);

    expect(result.errors).toEqual([]);
    expect(result.schema?.schemaVersion).toBe(2);
  });
  it('accepts quarter-based V2 sidebar widths', () => {
    expect(
      parseLayoutSchema(
        JSON.stringify({
          schemaVersion: 2,
          meta: { name: 'Landscape sidebar' },
          regions: [
            { id: 'sidebar', width: '25%', direction: 'column', sections: ['header'] },
            { id: 'main', width: '75%', direction: 'column', sections: ['itemsTable'] }
          ]
        })
      ).errors
    ).toEqual([]);
  });
  it('rejects invalid v2 region definitions', () => {
    const result = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 2,
        meta: { name: 'Invalid regions' },
        regions: [
          { id: 'main', width: '45%', direction: 'column', sections: ['itemsTable'] },
          { id: 'main', width: '70%', direction: 'diagonal', sections: ['itemsTable', 'unknown'] },
          { id: 'empty', width: '100%', direction: 'grid' }
        ]
      })
    );

    expect(result.errors.map(error => error.path)).toEqual(
      expect.arrayContaining([
        'regions[0].width',
        'regions[1].id',
        'regions[1].direction',
        'regions[1].sections[0]',
        'regions[1].sections[1]',
        'regions[2]'
      ])
    );
  });
  it('rejects regions whose combined widths exceed the page', () => {
    const result = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 2,
        meta: { name: 'Too wide' },
        regions: [
          { id: 'main', width: '70%', direction: 'column', sections: ['itemsTable'] },
          { id: 'sidebar', width: '50%', direction: 'column', sections: ['notes'] }
        ]
      })
    );

    expect(result.errors.map(error => error.path)).toContain('regions');
  });
  it('accepts recursive V2 nodes with configured sections and overflow policy', () => {
    const result = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 2,
        meta: { name: 'Nested composition' },
        regions: [
          {
            id: 'main',
            width: '100%',
            direction: 'column',
            overflow: 'continue',
            children: [
              {
                type: 'row',
                gap: 10,
                children: [
                  { type: 'block', block: { type: 'logo' } },
                  {
                    type: 'section',
                    section: { type: 'itemsTable', visible: true, columnSizing: 'proportional' }
                  }
                ]
              }
            ]
          }
        ]
      })
    );

    expect(result.errors).toEqual([]);
  });
  it('rejects invalid recursive V2 nodes and duplicate configured sections', () => {
    const result = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 2,
        meta: { name: 'Invalid nested composition' },
        regions: [
          {
            id: 'main',
            width: '100%',
            direction: 'column',
            children: [
              { type: 'unknown', children: [] },
              { type: 'section', section: { type: 'notes', visible: true } },
              { type: 'section', section: { type: 'notes', visible: true } }
            ]
          }
        ]
      })
    );

    expect(result.errors.map(error => error.path)).toEqual(
      expect.arrayContaining(['regions[0].children[0].type', 'regions[0].children[2].section.type'])
    );
  });
  it('rejects duplicate sections and unsupported region children', () => {
    const result = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 2,
        meta: { name: 'Invalid content' },
        regions: [
          { id: 'one', width: '50%', direction: 'row', sections: ['notes'] },
          { id: 'two', width: '50%', direction: 'row', sections: ['notes'] },
          { id: 'three', width: '100%', direction: 'column', blocks: [{ type: 'script' }] }
        ]
      })
    );

    expect(result.errors.map(error => error.path)).toEqual(
      expect.arrayContaining(['regions[1].sections[0]', 'regions[2].blocks[0].type'])
    );
  });
  it('keeps invalid schema versions rejected through the v1 validator', () => {
    const result = parseLayoutSchema(
      JSON.stringify({ schemaVersion: 3, meta: { name: 'Invalid version' }, executable: 'alert()' })
    );

    expect(result.errors.map(error => error.path)).toEqual(expect.arrayContaining(['$.executable', 'schemaVersion']));
  });
  it('rejects unsupported executable-shaped properties', () =>
    expect(parseLayoutSchema(valid.replace('"meta"', '"script":"alert()","meta"')).errors[0]).toMatchObject({
      path: '$.script'
    }));
  it('rejects unsupported top-level properties and duplicate sections', () => {
    const result = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: 'Receipt' },
        sections: [
          { type: 'header', visible: true },
          { type: 'header', visible: false }
        ],
        theme: { fontFamily: 'Arial' }
      })
    );
    expect(result.errors.map(error => error.path)).toEqual(expect.arrayContaining(['$.theme', 'sections[1].type']));
  });

  it('accepts nested whitelisted header blocks', () => {
    expect(
      parseLayoutSchema(
        JSON.stringify({
          schemaVersion: 1,
          meta: { name: 'Compact' },
          sections: [
            { type: 'watermark', visible: 'auto', watermarkOrder: 'paidFirst' },
            {
              type: 'header',
              visible: true,
              blocks: [
                {
                  type: 'row',
                  justify: 'between',
                  gap: 10,
                  children: [
                    { type: 'column', width: '40%', children: [{ type: 'businessInfo' }] },
                    { type: 'column', width: '40%', children: [{ type: 'clientInfo' }] },
                    { type: 'column', width: '20%', children: [{ type: 'invoiceMeta', showInvoiceLabel: true }] }
                  ]
                }
              ]
            }
          ]
        })
      ).errors
    ).toEqual([]);
  });

  it('rejects unapproved header blocks and invalid nesting', () => {
    const result = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: 'Unsafe header' },
        sections: [
          {
            type: 'header',
            visible: true,
            blocks: [{ type: 'script' }, { type: 'logo', children: [{ type: 'title' }] }]
          }
        ]
      })
    );

    expect(result.errors.map(error => error.path)).toEqual(
      expect.arrayContaining(['sections[0].blocks[0].type', 'sections[0].blocks[1].children'])
    );
  });

  it('allows only known payment sources', () => {
    const validPayment = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: 'Legacy payment' },
        sections: [
          { type: 'header', visible: true, blocks: [{ type: 'paymentInfo', paymentSource: 'legacyBusiness' }] }
        ]
      })
    );
    const invalidPayment = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: 'Invalid payment' },
        sections: [{ type: 'header', visible: true, blocks: [{ type: 'paymentInfo', paymentSource: 'remote' }] }]
      })
    );

    expect(validPayment.errors).toEqual([]);
    expect(invalidPayment.errors.map(error => error.path)).toContain('sections[0].blocks[0].paymentSource');
  });

  it('validates grouped totals rows and their whitelisted blocks', () => {
    const validTotalsRow = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: 'Legacy Compact' },
        sections: [
          {
            type: 'totalsRow',
            visible: true,
            totalsBlocks: [
              { type: 'paymentInfo', paymentSource: 'legacyBusiness' },
              { type: 'spacer' },
              { type: 'financialTotals' }
            ]
          }
        ]
      })
    );
    const invalidTotalsRow = parseLayoutSchema(
      JSON.stringify({
        schemaVersion: 1,
        meta: { name: 'Invalid totals row' },
        sections: [{ type: 'totalsRow', visible: true, totalsBlocks: [{ type: 'script' }] }]
      })
    );

    expect(validTotalsRow.errors).toEqual([]);
    expect(invalidTotalsRow.errors.map(error => error.path)).toContain('sections[0].totalsBlocks[0].type');
  });
});
