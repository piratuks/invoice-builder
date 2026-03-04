// Utility to generate UBL 2.1 XML compliant with PEPPOL BIS Billing 3.0
// using the existing data.
//
// Scope: Generate a standards-aligned subset that covers all mandatory
// fields and commonly required recommended fields for successful exchange.
// https://docs.peppol.eu/poacc/billing/3.0/
// https://peppolvalidator.com/
// https://validator.invoice-portal.de/
//
// Note: XRechnung (UBL 2.1) and UBL 2.1 PEPPOL are almost identical therefore generateUBLInvoiceXML accepts EInvoice (ubl21 or xrechnung)
// Note: For XRechnung, the BuyerReference must contain the Leitweg-ID.

import { DateFormat } from '../../enums/dateFormat';
import { EInvoice } from '../../enums/einvoice';
import type { CalculatedInvoice } from '../../types/einvoice';
import type { Invoice } from '../../types/invoice';
import { formatDate, formatXml, splitAddress, xmlEscape } from './helperFunctions';
import {
  calculateDiscount,
  calculateInvoiceTotals,
  getInvoiceItemAmount,
  getTotalAmountPaidCents
} from './invoiceFunctions';

const amountTag = (name: string, n: number, currency: string): string => {
  return `<cbc:${name} currencyID="${xmlEscape(currency)}">${n.toFixed(2)}</cbc:${name}>`;
};

const decimals2 = (n: number): string => {
  return (Math.round(n * 100) / 100).toFixed(2);
};

const decimals4 = (n: number): string => {
  return (Math.round(n * 10000) / 10000).toFixed(4);
};

const getVatGroups = (invoice: Invoice): { rate: number; taxable: number }[] => {
  const groups = new Map<number, number>();

  const totalGross = invoice.invoiceItems.reduce((sum, item) => sum + getInvoiceItemAmount(item), 0);

  invoice.invoiceItems.forEach(item => {
    const rate = item.taxType != undefined ? item.taxRate : invoice.taxRate;

    const lineGross = getInvoiceItemAmount(item);
    const discountCents = totalGross
      ? Math.round((lineGross / totalGross) * calculateDiscount(totalGross, invoice))
      : 0;

    const lineNet = lineGross - discountCents;

    if (groups.has(rate)) {
      groups.set(rate, groups.get(rate)! + lineNet);
    } else {
      groups.set(rate, lineNet);
    }
  });

  return Array.from(groups.entries()).map(([rate, taxable]) => ({
    rate,
    taxable
  }));
};

const allocateDiscountByVat = (invoice: Invoice, discountCents: number): { rate: number; amount: number }[] => {
  if (!discountCents) return [];

  const groups = getVatGroups(invoice);

  if (groups.length <= 1) {
    return [
      {
        rate: groups[0]?.rate ?? invoice.taxRate ?? 0,
        amount: discountCents / invoice.invoiceCurrencySnapshot!.currencySubunit
      }
    ];
  }

  const totalTaxable = groups.reduce((sum, g) => sum + g.taxable, 0);
  return groups.map((g, index) => {
    if (index === groups.length - 1) {
      const allocatedSoFar = groups
        .slice(0, index)
        .reduce((sum, prev) => sum + (discountCents * prev.taxable) / totalTaxable, 0);
      return {
        rate: g.rate,
        amount: (discountCents - allocatedSoFar) / invoice.invoiceCurrencySnapshot!.currencySubunit
      };
    }
    return {
      rate: g.rate,
      amount: (discountCents * g.taxable) / totalTaxable / invoice.invoiceCurrencySnapshot!.currencySubunit
    };
  });
};

const getXMLDiscount = (invoice: Invoice, discountCents: number) => {
  const allocations = allocateDiscountByVat(invoice, discountCents).sort((a, b) => a.rate - b.rate);
  let runningTotal = 0;
  const rounded = allocations.map((d, index) => {
    if (index === allocations.length - 1) {
      return d;
    }

    const roundedAmount = Math.round(d.amount * 100) / 100;
    runningTotal += roundedAmount;

    return { ...d, amount: roundedAmount };
  });
  const targetTotal = Math.round(discountCents) / 100;
  const remainder = +(targetTotal - runningTotal).toFixed(2);
  rounded[rounded.length - 1] = {
    ...rounded[rounded.length - 1],
    amount: remainder
  };
  return rounded
    .filter(d => d.amount > 0)
    .map(
      d => `
      <cac:AllowanceCharge>
        <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
        <cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason>
        <cbc:Amount currencyID="${xmlEscape(invoice.invoiceCurrencySnapshot!.currencyCode)}">${decimals2(d.amount)}</cbc:Amount>
        <cac:TaxCategory>
          <cbc:ID>${d.rate > 0 ? 'S' : 'Z'}</cbc:ID> 
          <cbc:Percent>${decimals2(d.rate)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>${xmlEscape(invoice.taxName || 'VAT')}</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:AllowanceCharge>
    `
    )
    .join('');
};

const getAllowances = (invoice: Invoice, calc: CalculatedInvoice) => {
  const shippingAmount = Number(invoice.shippingFeeCents) / invoice.invoiceCurrencySnapshot!.currencySubunit;
  const discountXml = getXMLDiscount(invoice, calc.discountTotal);

  return `
    ${discountXml}
    ${
      calc.shippingTotal > 0
        ? `
        <cac:AllowanceCharge>
          <cbc:ChargeIndicator>true</cbc:ChargeIndicator>
          <cbc:AllowanceChargeReason>Shipping fee</cbc:AllowanceChargeReason>
          <cbc:Amount currencyID="${xmlEscape(invoice.invoiceCurrencySnapshot!.currencyCode)}">${shippingAmount}</cbc:Amount>
          <cac:TaxCategory>
            <cbc:ID>Z</cbc:ID>
            <cbc:Percent>0.00</cbc:Percent>
            <cac:TaxScheme><cbc:ID>${xmlEscape(invoice.taxName || 'VAT')}</cbc:ID></cac:TaxScheme>
          </cac:TaxCategory>
        </cac:AllowanceCharge>`
        : ''
    }
  `;
};

const getXMLHeader = (invoice: Invoice, einvoice: EInvoice.ubl21 | EInvoice.xrechnung) => {
  const noteText = [invoice.thanksNotes, invoice.customerNotes, invoice.termsConditionNotes]
    .filter(Boolean)
    .join(' | ');

  const issueDate = formatDate(invoice.issuedAt ?? new Date(), DateFormat.yyyyMMddDash);
  const dueDate = invoice.dueDate ? formatDate(invoice.dueDate, DateFormat.yyyyMMddDash) : undefined;
  const customizationID =
    einvoice === EInvoice.xrechnung
      ? 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0'
      : 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0';

  return `
    <cbc:CustomizationID>${customizationID}</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>${xmlEscape(invoice.invoiceNumber)}</cbc:ID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
    <cbc:DueDate>${dueDate}</cbc:DueDate>
    <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
    ${noteText ? `<cbc:Note>${xmlEscape(noteText)}</cbc:Note>` : ''}
    <cbc:DocumentCurrencyCode>${xmlEscape(invoice.invoiceCurrencySnapshot!.currencyCode)}</cbc:DocumentCurrencyCode>
    <cbc:BuyerReference>${invoice.invoiceClientSnapshot!.clientBuyerReference}</cbc:BuyerReference>
  `;
};

const getXMLSupplier = (invoice: Invoice, einvoice: EInvoice.ubl21 | EInvoice.xrechnung) => {
  const sellerAddress = splitAddress(invoice.invoiceBusinessSnapshot?.businessAddress);
  if (!sellerAddress.countryCode && invoice.invoiceBusinessSnapshot!.businessCountryCode) {
    sellerAddress.countryCode = invoice.invoiceBusinessSnapshot!.businessCountryCode.toUpperCase();
  }

  const supplierParty = `
  <cac:AccountingSupplierParty>
    <cac:Party>
      ${invoice.invoiceBusinessSnapshot!.businessPeppolEndpointId ? `<cbc:EndpointID${invoice.invoiceBusinessSnapshot!.businessPeppolEndpointSchemeId ? ` schemeID="${xmlEscape(invoice.invoiceBusinessSnapshot!.businessPeppolEndpointSchemeId)}"` : ''}>${xmlEscape(invoice.invoiceBusinessSnapshot!.businessPeppolEndpointId)}</cbc:EndpointID>` : ''}
      <cac:PartyName><cbc:Name>${xmlEscape(invoice.invoiceBusinessSnapshot!.businessName)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        ${sellerAddress.street ? `<cbc:StreetName>${xmlEscape(sellerAddress.street)}</cbc:StreetName>` : ''}
        ${sellerAddress.city ? `<cbc:CityName>${xmlEscape(sellerAddress.city)}</cbc:CityName>` : ''}
        ${sellerAddress.postalZone ? `<cbc:PostalZone>${xmlEscape(sellerAddress.postalZone)}</cbc:PostalZone>` : ''}
        <cac:Country><cbc:IdentificationCode>${xmlEscape(sellerAddress.countryCode)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${invoice.invoiceBusinessSnapshot?.businessVatCode || invoice.invoiceBusinessSnapshot?.businessCode ? `<cac:PartyTaxScheme><cbc:CompanyID>${xmlEscape(invoice.invoiceBusinessSnapshot?.businessVatCode || invoice.invoiceBusinessSnapshot?.businessCode)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>${invoice.taxName || 'VAT'}</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEscape(invoice.invoiceBusinessSnapshot!.businessName)}</cbc:RegistrationName>
        ${invoice.invoiceBusinessSnapshot!.businessVatCode ? `<cbc:CompanyID>${xmlEscape(invoice.invoiceBusinessSnapshot!.businessVatCode)}</cbc:CompanyID>` : ''}
      </cac:PartyLegalEntity>
      ${
        invoice.invoiceBusinessSnapshot!.businessPhone || invoice.invoiceBusinessSnapshot!.businessEmail
          ? `
      <cac:Contact>
        ${invoice.invoiceBusinessSnapshot!.businessName && einvoice === EInvoice.xrechnung ? `<cbc:Name>${xmlEscape(invoice.invoiceBusinessSnapshot!.businessName)}</cbc:Name>` : ''}
        ${invoice.invoiceBusinessSnapshot!.businessPhone ? `<cbc:Telephone>${xmlEscape(invoice.invoiceBusinessSnapshot!.businessPhone)}</cbc:Telephone>` : ''}
        ${invoice.invoiceBusinessSnapshot!.businessEmail ? `<cbc:ElectronicMail>${xmlEscape(invoice.invoiceBusinessSnapshot!.businessEmail)}</cbc:ElectronicMail>` : ''}
      </cac:Contact>`
          : ''
      }
    </cac:Party>
  </cac:AccountingSupplierParty>`;

  return supplierParty;
};

const getXMLBuyer = (invoice: Invoice) => {
  const buyerAddress = splitAddress(invoice.invoiceClientSnapshot?.clientAddress);
  if (!buyerAddress.countryCode && invoice.invoiceClientSnapshot!.clientCountryCode) {
    buyerAddress.countryCode = invoice.invoiceClientSnapshot!.clientCountryCode.toUpperCase();
  }

  const customerParty = `
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${invoice.invoiceClientSnapshot!.clientPeppolEndpointId ? `<cbc:EndpointID${invoice.invoiceClientSnapshot!.clientPeppolEndpointSchemeId ? ` schemeID="${xmlEscape(invoice.invoiceClientSnapshot!.clientPeppolEndpointSchemeId)}"` : ''}>${xmlEscape(invoice.invoiceClientSnapshot!.clientPeppolEndpointId)}</cbc:EndpointID>` : ''}
      <cac:PartyName><cbc:Name>${xmlEscape(invoice.invoiceClientSnapshot!.clientName)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        ${buyerAddress.street ? `<cbc:StreetName>${xmlEscape(buyerAddress.street)}</cbc:StreetName>` : ''}
        ${buyerAddress.city ? `<cbc:CityName>${xmlEscape(buyerAddress.city)}</cbc:CityName>` : ''}
        ${buyerAddress.postalZone ? `<cbc:PostalZone>${xmlEscape(buyerAddress.postalZone)}</cbc:PostalZone>` : ''}
        <cac:Country><cbc:IdentificationCode>${xmlEscape(buyerAddress.countryCode)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${invoice.invoiceClientSnapshot!.clientVatCode ? `<cac:PartyTaxScheme><cbc:CompanyID>${xmlEscape(invoice.invoiceClientSnapshot!.clientVatCode)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>${invoice.taxName || 'VAT'}</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEscape(invoice.invoiceClientSnapshot!.clientName)}</cbc:RegistrationName>
        ${invoice.invoiceClientSnapshot!.clientVatCode ? `<cbc:CompanyID>${xmlEscape(invoice.invoiceClientSnapshot!.clientVatCode)}</cbc:CompanyID>` : ''}
      </cac:PartyLegalEntity>
      ${
        invoice.invoiceClientSnapshot!.clientPhone || invoice.invoiceClientSnapshot!.clientEmail
          ? `
      <cac:Contact>
        ${invoice.invoiceClientSnapshot!.clientPhone ? `<cbc:Telephone>${xmlEscape(invoice.invoiceClientSnapshot!.clientPhone)}</cbc:Telephone>` : ''}
        ${invoice.invoiceClientSnapshot!.clientEmail ? `<cbc:ElectronicMail>${xmlEscape(invoice.invoiceClientSnapshot!.clientEmail)}</cbc:ElectronicMail>` : ''}
      </cac:Contact>`
          : ''
      }
    </cac:Party>
  </cac:AccountingCustomerParty>`;

  return customerParty;
};

const getXMLDelivery = (invoice: Invoice) => {
  const issueDate = formatDate(invoice.issuedAt ?? new Date(), DateFormat.yyyyMMddDash);

  return `
    <cac:Delivery>
      <cbc:ActualDeliveryDate>${issueDate}</cbc:ActualDeliveryDate>
    </cac:Delivery>
  `;
};

const getXMLPaymentMeans = (invoice: Invoice) => {
  const paymentMeans = invoice.invoiceBankSnapshot
    ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      ${invoice.invoiceBankSnapshot.accountNumber ? `<cbc:ID>${xmlEscape(invoice.invoiceBankSnapshot.accountNumber)}</cbc:ID>` : ''}
      ${invoice.invoiceBankSnapshot.accountHolder ? `<cbc:Name>${xmlEscape(invoice.invoiceBankSnapshot.accountHolder)}</cbc:Name>` : ''}
      ${
        invoice.invoiceBankSnapshot.swiftCode || invoice.invoiceBankSnapshot.bankName
          ? `
      <cac:FinancialInstitutionBranch>
        ${invoice.invoiceBankSnapshot.swiftCode ? `<cbc:ID>${xmlEscape(invoice.invoiceBankSnapshot.swiftCode)}</cbc:ID>` : ''}
      </cac:FinancialInstitutionBranch>`
          : ''
      }
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>`
    : '';

  return paymentMeans;
};

const getXMLShippingTaxTotal = (invoice: Invoice, zeroTaxItemAmount: number) => {
  const shippingCents = Number(invoice.shippingFeeCents);
  const c = invoice.invoiceCurrencySnapshot!;

  if (shippingCents <= 0 && zeroTaxItemAmount <= 0) return '';

  const shippingAmount = shippingCents / c.currencySubunit;
  const zeroTaxAmount = zeroTaxItemAmount / c.currencySubunit;

  return `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${xmlEscape(c.currencyCode)}">${decimals2(shippingAmount + zeroTaxAmount)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${xmlEscape(c.currencyCode)}">0.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>Z</cbc:ID>
        <cbc:Percent>0.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>${xmlEscape(invoice.taxName || 'VAT')}</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  `;
};

const getXMLTaxTotal = (invoice: Invoice, calc: CalculatedInvoice) => {
  const c = invoice.invoiceCurrencySnapshot!;
  const vatGroups = [...calc.vatGroups];
  const totalTax = calc.taxTotal / c.currencySubunit;
  const positiveTaxGroups = vatGroups.filter(g => g.rate > 0);
  const zeroTaxGroup = vatGroups.find(g => g.rate === 0);
  const zeroTaxAmount = zeroTaxGroup ? zeroTaxGroup.taxable : 0;
  const shippingSubtotalXML = getXMLShippingTaxTotal(invoice, zeroTaxAmount);

  let runningSum = 0;
  const taxableGroupsXML = vatGroups
    .filter(g => g.rate > 0)
    .map((g, idx) => {
      const taxable = g.taxable / c.currencySubunit;
      let tax: number = 0;

      if (idx === positiveTaxGroups.length - 1) {
        tax = totalTax - runningSum;
      } else {
        tax = (taxable * g.rate) / 100;
        tax = Math.round(tax * 100) / 100;
        runningSum += tax;
      }

      const finalTax = calc.taxTotal < 0 ? -tax : tax;

      return `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${xmlEscape(c.currencyCode)}">${decimals2(taxable)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${xmlEscape(c.currencyCode)}">${decimals2(finalTax)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${g.rate > 0 ? 'S' : 'Z'}</cbc:ID> 
          <cbc:Percent>${decimals2(g.rate)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>${xmlEscape(invoice.taxName || 'VAT')}</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
      `;
    })
    .join('');

  return `
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${xmlEscape(c.currencyCode)}">${decimals2(totalTax)}</cbc:TaxAmount>
      ${taxableGroupsXML}
      ${shippingSubtotalXML}
    </cac:TaxTotal>
  `;
};

const getXMLLegalMonetaryTotal = (invoice: Invoice, calc: CalculatedInvoice) => {
  const c = invoice.invoiceCurrencySnapshot!;
  const toUnit = (cents: number) => cents / c.currencySubunit;

  const paidCents = getTotalAmountPaidCents(invoice.invoicePayments);
  return `
    <cac:LegalMonetaryTotal>
      ${amountTag('LineExtensionAmount', toUnit(calc.subtotalNet + calc.discountTotal), c.currencyCode)}
      ${amountTag('TaxExclusiveAmount', toUnit(calc.subtotalNet + calc.shippingTotal), c.currencyCode)}
      ${amountTag('TaxInclusiveAmount', toUnit(calc.subtotalNet + calc.shippingTotal + calc.taxTotal), c.currencyCode)}
      ${calc.discountTotal > 0 ? amountTag('AllowanceTotalAmount', toUnit(calc.discountTotal), c.currencyCode) : ''}
      ${calc.shippingTotal > 0 ? amountTag('ChargeTotalAmount', toUnit(calc.shippingTotal), c.currencyCode) : ''}
      ${paidCents > 0 ? amountTag('PrepaidAmount', toUnit(paidCents), c.currencyCode) : ''}
      ${amountTag('PayableAmount', toUnit(calc.payableTotal - paidCents), c.currencyCode)}
    </cac:LegalMonetaryTotal>
  `;
};

const getXMLLines = (invoice: Invoice, calc: CalculatedInvoice) => {
  const c = invoice.invoiceCurrencySnapshot!;
  const lines = calc.lines.map((l, idx) => {
    const quantity = Number(invoice.invoiceItems[idx].quantity);
    const lineAmount = Number(decimals2((l.lineAmount + l.discountAmount) / c.currencySubunit));
    const price = lineAmount / quantity;
    return { ...l, quantity, lineAmount, price };
  });

  const sumLines = lines.reduce((sum, l) => sum + l.lineAmount, 0);
  const net = (calc.subtotalNet + calc.discountTotal) / c.currencySubunit;
  const diff = Number(decimals2(net)) - sumLines;

  lines[lines.length - 1].lineAmount += diff;
  lines[lines.length - 1].price = lines[lines.length - 1].lineAmount / lines[lines.length - 1].quantity;

  return lines
    .map(
      (l, idx) => `
        <cac:InvoiceLine>
          <cbc:ID>${idx + 1}</cbc:ID>
          <cbc:InvoicedQuantity unitCode="EA">${decimals2(Number(invoice.invoiceItems[idx].quantity))}</cbc:InvoicedQuantity>
          <cbc:LineExtensionAmount currencyID="${xmlEscape(c.currencyCode)}">${decimals2(l.lineAmount)}</cbc:LineExtensionAmount>
          <cac:Item>
            <cbc:Name>${xmlEscape(invoice.invoiceItems[idx].invoiceItemSnapshot!.itemName)}</cbc:Name>
            <cac:ClassifiedTaxCategory>
              <cbc:ID>${l.taxCategoryId}</cbc:ID>
              <cbc:Percent>${decimals2(l.taxRate)}</cbc:Percent>
              <cac:TaxScheme><cbc:ID>${xmlEscape(invoice.taxName || 'VAT')}</cbc:ID></cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
          </cac:Item>
          <cac:Price>
            <cbc:PriceAmount currencyID="${xmlEscape(c.currencyCode)}">${decimals4(l.price)}</cbc:PriceAmount>
          </cac:Price>
        </cac:InvoiceLine>
        `
    )
    .join('');
};

const validateUBLPeppol = (invoice: Invoice) => {
  if (!invoice.invoiceCurrencySnapshot || !invoice.invoiceBusinessSnapshot || !invoice.invoiceClientSnapshot)
    throw new Error('error.peppolNotSupported');
  if (
    !invoice.invoiceBusinessSnapshot.businessPeppolEndpointId ||
    !invoice.invoiceBusinessSnapshot.businessPeppolEndpointSchemeId
  )
    throw new Error('error.peppolBusinessSchema');
  if (
    !invoice.invoiceClientSnapshot.clientPeppolEndpointId ||
    !invoice.invoiceClientSnapshot.clientPeppolEndpointSchemeId
  )
    throw new Error('error.peppolClientSchema');
  if (!invoice.invoiceClientSnapshot.clientBuyerReference) throw new Error('error.peppolClientReference');
  if (!invoice.invoiceClientSnapshot.clientCountryCode) throw new Error('error.peppolClientCC');
  if (!invoice.invoiceBusinessSnapshot.businessCountryCode) throw new Error('error.peppolBusinessCC');
  if (!invoice.dueDate) throw new Error('error.peppolDueDate');
  if (!invoice.invoiceBusinessSnapshot.businessCode && !invoice.invoiceBusinessSnapshot.businessVatCode)
    throw new Error('error.peppolBusinessVATCode');
};

const validateXRechung = (invoice: Invoice) => {
  if (!invoice.invoiceCurrencySnapshot || !invoice.invoiceBusinessSnapshot || !invoice.invoiceClientSnapshot)
    throw new Error('error.xrechnungNotSupported');
  if (
    !invoice.invoiceBusinessSnapshot.businessPeppolEndpointId ||
    !invoice.invoiceBusinessSnapshot.businessPeppolEndpointSchemeId
  )
    throw new Error('error.xrechnungBusinessSchema');
  if (
    !invoice.invoiceClientSnapshot.clientPeppolEndpointId ||
    !invoice.invoiceClientSnapshot.clientPeppolEndpointSchemeId
  )
    throw new Error('error.xrechnungClientSchema');
  if (!invoice.invoiceClientSnapshot.clientBuyerReference) throw new Error('error.xrechnungClientReference');
  if (!invoice.invoiceClientSnapshot.clientCountryCode) throw new Error('error.xrechnungClientCC');
  if (!invoice.invoiceBusinessSnapshot.businessCountryCode) throw new Error('error.xrechnungBusinessCC');
  if (!invoice.dueDate) throw new Error('error.xrechnungDueDate');
  if (!invoice.invoiceBusinessSnapshot.businessCode && !invoice.invoiceBusinessSnapshot.businessVatCode)
    throw new Error('error.xrechnungBusinessVATCode');
  if (!invoice.invoiceBusinessSnapshot.businessEmail) throw new Error('error.xrechnungBusinessEmail');
  if (!invoice.invoiceBusinessSnapshot.businessPhone) throw new Error('error.xrechnungBusinessPhone');
  if (!invoice.invoiceClientSnapshot.clientAddress) throw new Error('error.xrechnungClientAddress');
};

export const generateUBLInvoiceXML = (invoice: Invoice, einvoice: EInvoice.ubl21 | EInvoice.xrechnung): string => {
  if (einvoice === EInvoice.ubl21) {
    validateUBLPeppol(invoice);
  } else {
    validateXRechung(invoice);
  }

  const calc = calculateInvoiceTotals(invoice);

  const raw = `<?xml version="1.0" encoding="UTF-8"?>
      <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
        <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
        ${getXMLHeader(invoice, einvoice)}
        ${getXMLSupplier(invoice, einvoice)}
        ${getXMLBuyer(invoice)}
        ${einvoice === EInvoice.xrechnung ? getXMLDelivery(invoice) : ''}
        ${getXMLPaymentMeans(invoice)}
        ${getAllowances(invoice, calc)}
        ${getXMLTaxTotal(invoice, calc)}
        ${getXMLLegalMonetaryTotal(invoice, calc)}
        ${getXMLLines(invoice, calc)}
        </Invoice>`;

  return formatXml(raw);
};
