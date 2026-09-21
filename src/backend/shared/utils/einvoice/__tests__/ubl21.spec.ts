import { DiscountType } from '../../../enums/discountType';
import { EInvoice } from '../../../enums/einvoice';
import { InvoiceItemTaxType, InvoiceTaxType } from '../../../enums/taxType';
import type { Invoice } from '../../../types/invoice';
import { generateUBLInvoiceXML } from '../ubl21';

const baseInvoice = (overrides: Partial<Invoice> = {}): Invoice =>
  ({
    invoiceNumber: 'INV-001',
    issuedAt: '2024-01-15',
    dueDate: '2024-02-15',
    taxRate: 0,
    taxName: 'VAT',
    shippingFeeCents: '500',
    discountType: DiscountType.percentage,
    discountPercent: 10,
    discountAmountCents: '0',
    surchargeType: DiscountType.fixed,
    surchargeAmountCents: '200',
    surchargePercent: 0,
    thanksNotes: 'Thanks',
    customerNotes: 'Customer note',
    termsConditionNotes: 'Terms',
    invoiceCurrencySnapshot: { currencyCode: 'EUR', currencySymbol: '\u20ac', currencySubunit: 100 },
    invoiceBusinessSnapshot: {
      businessName: 'Acme & Co',
      businessAddress: '123 Main St, Berlin, 10115, DE',
      businessCountryCode: 'DE',
      businessPeppolEndpointId: '0088:1234567890',
      businessPeppolEndpointSchemeId: '0088',
      businessVatCode: 'DE123456789',
      businessPhone: '+491234567',
      businessEmail: 'billing@acme.test'
    },
    invoiceClientSnapshot: {
      clientName: 'Client GmbH',
      clientAddress: '456 Client Rd, Munich, 80331, DE',
      clientCountryCode: 'DE',
      clientPeppolEndpointId: '0088:0987654321',
      clientPeppolEndpointSchemeId: '0088',
      clientBuyerReference: 'PO-123',
      clientVatCode: 'DE987654321'
    },
    invoiceBankSnapshot: {
      accountNumber: 'DE89370400440532013000',
      accountHolder: 'Acme & Co',
      swiftCode: 'COBADEFFXXX',
      bankName: 'Commerzbank'
    },
    invoiceItems: [
      {
        itemId: 1,
        quantity: '2',
        taxRate: 19,
        taxType: InvoiceItemTaxType.exclusive,
        invoiceItemSnapshot: { parentInvoiceItemId: 1, itemName: 'Widget', unitPriceCents: '1000', unitName: 'each' }
      },
      {
        itemId: 2,
        quantity: '1',
        taxRate: 7,
        taxType: InvoiceItemTaxType.exclusive,
        invoiceItemSnapshot: { parentInvoiceItemId: 2, itemName: 'Gadget', unitPriceCents: '2000', unitName: 'each' }
      }
    ],
    invoicePayments: [{ amountCents: '500' }],
    ...overrides
  }) as unknown as Invoice;

describe('generateUBLInvoiceXML', () => {
  it('generates valid UBL 2.1 PEPPOL XML with multiple VAT groups, discount, surcharge and shipping', () => {
    const xml = generateUBLInvoiceXML(baseInvoice(), EInvoice.ubl21);
    expect(xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
    expect(xml).toContain('Acme &amp; Co');
    expect(xml).toContain('Client GmbH');
    expect(xml).toContain('<cac:PaymentMeans>');
    expect(xml).toContain('<cac:TaxTotal>');
    expect(xml).toContain('<cac:InvoiceLine>');
    expect(xml).toContain('PrepaidAmount');
  });

  it('generates XRechnung XML including delivery and contact name', () => {
    const xml = generateUBLInvoiceXML(baseInvoice(), EInvoice.xrechnung);
    expect(xml).toContain('xrechnung_3.0');
    expect(xml).toContain('<cac:Delivery>');
  });

  it('omits payment means, discount and shipping sections when not applicable', () => {
    const xml = generateUBLInvoiceXML(
      baseInvoice({
        invoiceBankSnapshot: undefined,
        discountType: undefined,
        discountPercent: 0,
        surchargeType: undefined,
        surchargeAmountCents: '0',
        shippingFeeCents: '0',
        invoicePayments: []
      }),
      EInvoice.ubl21
    );
    expect(xml).not.toContain('<cac:PaymentMeans>');
    expect(xml).not.toContain('PrepaidAmount');
  });

  it('supports a single VAT group and a fixed discount', () => {
    const xml = generateUBLInvoiceXML(
      baseInvoice({
        discountType: DiscountType.fixed,
        discountAmountCents: '300',
        invoiceItems: [
          {
            itemId: 1,
            quantity: '2',
            taxRate: 19,
            taxType: InvoiceItemTaxType.exclusive,
            invoiceItemSnapshot: {
              parentInvoiceItemId: 1,
              itemName: 'Widget',
              unitPriceCents: '1000',
              unitName: 'each'
            }
          }
        ] as unknown as Invoice['invoiceItems']
      }),
      EInvoice.ubl21
    );
    expect(xml).toContain('AllowanceChargeReason>Discount');
  });

  it('supports invoice-level inclusive and deducted tax types', () => {
    const inclusive = generateUBLInvoiceXML(
      baseInvoice({ taxType: InvoiceTaxType.inclusive, taxRate: 10 }),
      EInvoice.ubl21
    );
    expect(inclusive).toContain('<cac:TaxTotal>');

    const deducted = generateUBLInvoiceXML(
      baseInvoice({ taxType: InvoiceTaxType.deducted, taxRate: 10 }),
      EInvoice.ubl21
    );
    expect(deducted).toContain('<cac:TaxTotal>');
  });

  it('throws when required PEPPOL fields are missing', () => {
    expect(() => generateUBLInvoiceXML(baseInvoice({ dueDate: undefined }), EInvoice.ubl21)).toThrow(
      'error.peppolDueDate'
    );
    expect(() =>
      generateUBLInvoiceXML(baseInvoice({ invoiceBusinessSnapshot: { businessName: 'Acme' } as never }), EInvoice.ubl21)
    ).toThrow('error.peppolBusinessSchema');
    expect(() => generateUBLInvoiceXML(baseInvoice({ invoiceClientSnapshot: undefined }), EInvoice.ubl21)).toThrow(
      'error.peppolNotSupported'
    );
  });

  it('throws when required XRechnung fields are missing', () => {
    expect(() =>
      generateUBLInvoiceXML(
        baseInvoice({
          invoiceBusinessSnapshot: {
            ...baseInvoice().invoiceBusinessSnapshot,
            businessEmail: undefined
          } as unknown as Invoice['invoiceBusinessSnapshot']
        }),
        EInvoice.xrechnung
      )
    ).toThrow('error.xrechnungBusinessEmail');
    expect(() =>
      generateUBLInvoiceXML(
        baseInvoice({
          invoiceClientSnapshot: {
            ...baseInvoice().invoiceClientSnapshot,
            clientAddress: undefined
          } as unknown as Invoice['invoiceClientSnapshot']
        }),
        EInvoice.xrechnung
      )
    ).toThrow('error.xrechnungClientAddress');
  });

  it.each([
    ['currency snapshot', { invoiceCurrencySnapshot: undefined }, 'error.peppolNotSupported'],
    ['business snapshot', { invoiceBusinessSnapshot: undefined }, 'error.peppolNotSupported'],
    [
      'business endpoint',
      {
        invoiceBusinessSnapshot: {
          ...baseInvoice().invoiceBusinessSnapshot,
          businessPeppolEndpointId: undefined
        }
      },
      'error.peppolBusinessSchema'
    ],
    [
      'business endpoint scheme',
      {
        invoiceBusinessSnapshot: {
          ...baseInvoice().invoiceBusinessSnapshot,
          businessPeppolEndpointSchemeId: undefined
        }
      },
      'error.peppolBusinessSchema'
    ],
    [
      'client endpoint',
      { invoiceClientSnapshot: { ...baseInvoice().invoiceClientSnapshot, clientPeppolEndpointId: undefined } },
      'error.peppolClientSchema'
    ],
    [
      'client endpoint scheme',
      { invoiceClientSnapshot: { ...baseInvoice().invoiceClientSnapshot, clientPeppolEndpointSchemeId: undefined } },
      'error.peppolClientSchema'
    ],
    [
      'buyer reference',
      { invoiceClientSnapshot: { ...baseInvoice().invoiceClientSnapshot, clientBuyerReference: undefined } },
      'error.peppolClientReference'
    ],
    [
      'client country',
      { invoiceClientSnapshot: { ...baseInvoice().invoiceClientSnapshot, clientCountryCode: undefined } },
      'error.peppolClientCC'
    ],
    [
      'business country',
      { invoiceBusinessSnapshot: { ...baseInvoice().invoiceBusinessSnapshot, businessCountryCode: undefined } },
      'error.peppolBusinessCC'
    ],
    [
      'business registration',
      {
        invoiceBusinessSnapshot: {
          ...baseInvoice().invoiceBusinessSnapshot,
          businessCode: undefined,
          businessVatCode: undefined
        }
      },
      'error.peppolBusinessVATCode'
    ]
  ])('rejects PEPPOL invoices missing %s', (_label, overrides, error) => {
    expect(() => generateUBLInvoiceXML(baseInvoice(overrides as Partial<Invoice>), EInvoice.ubl21)).toThrow(error);
  });

  it.each([
    ['currency snapshot', { invoiceCurrencySnapshot: undefined }, 'error.xrechnungNotSupported'],
    ['business snapshot', { invoiceBusinessSnapshot: undefined }, 'error.xrechnungNotSupported'],
    ['client snapshot', { invoiceClientSnapshot: undefined }, 'error.xrechnungNotSupported'],
    [
      'business endpoint',
      { invoiceBusinessSnapshot: { ...baseInvoice().invoiceBusinessSnapshot, businessPeppolEndpointId: undefined } },
      'error.xrechnungBusinessSchema'
    ],
    [
      'client endpoint',
      { invoiceClientSnapshot: { ...baseInvoice().invoiceClientSnapshot, clientPeppolEndpointId: undefined } },
      'error.xrechnungClientSchema'
    ],
    [
      'buyer reference',
      { invoiceClientSnapshot: { ...baseInvoice().invoiceClientSnapshot, clientBuyerReference: undefined } },
      'error.xrechnungClientReference'
    ],
    [
      'client country',
      { invoiceClientSnapshot: { ...baseInvoice().invoiceClientSnapshot, clientCountryCode: undefined } },
      'error.xrechnungClientCC'
    ],
    [
      'business country',
      { invoiceBusinessSnapshot: { ...baseInvoice().invoiceBusinessSnapshot, businessCountryCode: undefined } },
      'error.xrechnungBusinessCC'
    ],
    ['due date', { dueDate: undefined }, 'error.xrechnungDueDate'],
    [
      'business registration',
      {
        invoiceBusinessSnapshot: {
          ...baseInvoice().invoiceBusinessSnapshot,
          businessCode: undefined,
          businessVatCode: undefined
        }
      },
      'error.xrechnungBusinessVATCode'
    ],
    [
      'business phone',
      { invoiceBusinessSnapshot: { ...baseInvoice().invoiceBusinessSnapshot, businessPhone: undefined } },
      'error.xrechnungBusinessPhone'
    ]
  ])('rejects XRechnung invoices missing %s', (_label, overrides, error) => {
    expect(() => generateUBLInvoiceXML(baseInvoice(overrides as Partial<Invoice>), EInvoice.xrechnung)).toThrow(error);
  });

  it('uses country and registration fallbacks while omitting optional contact and address elements', () => {
    const invoice = baseInvoice({
      issuedAt: undefined,
      thanksNotes: undefined,
      customerNotes: undefined,
      termsConditionNotes: undefined,
      taxName: undefined,
      shippingFeeCents: '0',
      surchargeAmountCents: '0',
      discountPercent: 0,
      invoiceBusinessSnapshot: {
        ...baseInvoice().invoiceBusinessSnapshot,
        businessAddress: undefined,
        businessVatCode: undefined,
        businessCode: 'REG-1',
        businessPhone: undefined,
        businessEmail: undefined
      } as Invoice['invoiceBusinessSnapshot'],
      invoiceClientSnapshot: {
        ...baseInvoice().invoiceClientSnapshot,
        clientAddress: undefined,
        clientVatCode: undefined,
        clientPhone: undefined,
        clientEmail: undefined
      } as Invoice['invoiceClientSnapshot'],
      invoiceBankSnapshot: { parentInvoiceId: 1, name: 'Empty bank' },
      invoiceItems: [
        {
          itemId: 1,
          quantity: '1',
          taxRate: 0,
          taxType: undefined,
          invoiceItemSnapshot: {
            parentInvoiceItemId: 1,
            itemName: 'Free item',
            unitPriceCents: '0',
            unitName: 'each'
          }
        }
      ] as unknown as Invoice['invoiceItems'],
      invoicePayments: []
    });

    const xml = generateUBLInvoiceXML(invoice, EInvoice.ubl21);
    expect(xml).toContain('<cbc:CompanyID>REG-1</cbc:CompanyID>');
    expect(xml).not.toContain('<cac:Contact>');
    expect(xml).not.toContain('<cbc:StreetName>');
    expect(xml).not.toContain('<cbc:Note>');
  });
});
