import { EInvoice } from '../../enums/einvoice';
import type { Invoice } from '../../types/invoice';
import { generateUBLInvoiceXML } from './ubl21';

export interface XMLProfile {
  id: string; // stable identifier (e.g. "ubl21")
  name: string; // human readable
  mediaType: string; // e.g. application/xml
  fileExtension: string; // e.g. xml
  generate: (invoice: Invoice) => string;
}

// Built-in providers map. Keep keys lowercase.
const PROFILES: Record<EInvoice, XMLProfile> = {
  ubl21: {
    id: EInvoice.ubl21,
    name: 'UBL 2.1 (PEPPOL BIS Billing 3.0)',
    mediaType: 'application/xml',
    fileExtension: 'xml',
    generate: invoice => generateUBLInvoiceXML(invoice, EInvoice.ubl21)
  },
  xrechnung: {
    id: EInvoice.xrechnung,
    name: 'XRechnung (UBL 2.1)',
    mediaType: 'application/xml',
    fileExtension: 'xml',
    generate: invoice => generateUBLInvoiceXML(invoice, EInvoice.xrechnung)
  }
};

export const listXMLProfiles = (): XMLProfile[] => {
  return Object.values(PROFILES);
};

export const getXMLProfile = (id: EInvoice): XMLProfile => {
  return PROFILES[id];
};

export const generateInvoiceXML = (
  profileId: keyof typeof PROFILES,
  invoice: Invoice
): { xml: string; profile: XMLProfile } => {
  const profile = getXMLProfile(profileId);
  const xml = profile.generate(invoice);
  return { xml, profile };
};
