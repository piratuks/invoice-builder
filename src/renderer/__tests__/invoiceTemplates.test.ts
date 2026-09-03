import { describe, expect, it } from 'vitest';
import { parseLayoutSchema } from '../shared/types/layouts';

const valid = JSON.stringify({
  schemaVersion: 1,
  meta: { name: 'Receipt' },
  sections: [{ type: 'header', visible: true }]
});

describe('invoice template schema', () => {
  it('accepts a strict valid v1 template', () => expect(parseLayoutSchema(valid).errors).toEqual([]));
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
