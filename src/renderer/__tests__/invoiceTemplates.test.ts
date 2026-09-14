import { describe, expect, it } from 'vitest';
import { parseLayoutSchema } from '../shared/types/layouts';

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
