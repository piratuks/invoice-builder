import { pdf } from '@react-pdf/renderer';
import { cloneElement, type ComponentProps, type ReactElement } from 'react';
import type { InvoicePdfDocument } from '../components/document.js';
import type { PDFDocument } from '../components/PDFDocument.js';

type InvoicePdfElement = ReactElement<
  Partial<ComponentProps<typeof InvoicePdfDocument>> & Partial<ComponentProps<typeof PDFDocument>>
>;

// Private layout API verified with @react-pdf/renderer 4.9.0 and
// @react-pdf/layout 5.2.0. Re-run v2PdfLayout.test.tsx when upgrading
// either dependency to check row measurement and pagination.
interface MeasuredNode {
  type?: string;
  props?: {
    id?: string;
    wrap?: boolean;
  };
  box?: {
    height?: number;
    paddingTop?: number;
    paddingBottom?: number;
  };
  style?: {
    height?: number;
  };
  children?: MeasuredNode[];
}

const findOversizedItemRows = (layout: MeasuredNode): Set<string> => {
  const rowIds = new Set<string>();
  const pages = layout.children?.filter(node => node.type === 'PAGE');

  if (!pages?.length) {
    throw new Error('Unable to measure PDF pages.');
  }

  for (const page of pages) {
    const height = page.style?.height;
    const { paddingTop = 0, paddingBottom = 0 } = page.box ?? {};

    if (typeof height !== 'number' || !Number.isFinite(height)) {
      throw new Error('Unable to measure PDF page height.');
    }

    const availableHeight = height - paddingTop - paddingBottom;

    if (availableHeight <= 0) {
      throw new Error('The PDF page has no space for content.');
    }

    const visit = (node: MeasuredNode, blockedByParent: boolean): void => {
      const id = node.props?.id;

      if (id?.startsWith('invoice-description-row-')) {
        const rowHeight = node.box?.height;

        if (typeof rowHeight !== 'number' || !Number.isFinite(rowHeight)) {
          throw new Error('Unable to measure an invoice item row.');
        }

        if (rowHeight > availableHeight) {
          if (blockedByParent) {
            throw new Error(
              'This layout keeps the item table together. Use a layout that allows the table to continue across pages.'
            );
          }

          rowIds.add(id);
        }

        return;
      }

      const blocksChildren = blockedByParent || node.props?.wrap === false;

      for (const child of node.children ?? []) {
        visit(child, blocksChildren);
      }
    };

    for (const child of page.children ?? []) {
      visit(child, false);
    }
  }

  return rowIds;
};

export const renderPdfDocument = async (document: InvoicePdfElement): Promise<Blob> => {
  const props = document.props;
  const input = props.input;
  if (input) {
    if (
      !input.invoiceForm ||
      typeof input.invoiceForm !== 'object' ||
      !input.storeSettings ||
      typeof input.storeSettings !== 'object' ||
      !Array.isArray(input.attachmentUrls) ||
      !input.pdfTexts ||
      typeof input.pdfTexts !== 'object' ||
      Object.values(input.pdfTexts).some(label => typeof label !== 'string') ||
      typeof input.layoutRequired !== 'string'
    ) {
      throw new Error('PDF input is missing required invoice, settings, labels, or attachment data.');
    }
    for (const attachment of input.attachmentUrls) {
      if (typeof attachment.url !== 'string' || !attachment.url) {
        throw new Error(`Missing inline data URL for invoice attachment ${attachment.id}.`);
      }
    }
  }
  const invoice = input?.invoiceForm ?? props.invoiceForm;
  const assets = [
    input?.logoUrl ?? props.logoUrl,
    input?.qrCodeUrl ?? props.qrCodeUrl,
    input?.signatureUrl ?? props.signatureUrl,
    input?.watermarkUrl ?? props.watermarkUrl,
    input?.watermarkPaidUrl ?? props.watermarkPaidUrl,
    ...(input?.attachmentUrls ?? props.attachmentUrls ?? []).map(attachment => attachment.url)
  ];
  for (const asset of assets) {
    if (asset !== undefined && !/^data:[^,]+,.+$/s.test(asset)) {
      throw new Error('PDF image assets must be non-empty inline data URLs.');
    }
  }
  const hasVisibleDescriptions =
    invoice?.invoiceCustomization?.showItemDescriptions === true &&
    invoice.invoiceItems?.some(item => Boolean(item.invoiceItemSnapshot.itemDescription?.trim()));

  if (!hasVisibleDescriptions) {
    return pdf(document).toBlob();
  }

  let splittableItemRowIds: Set<string> | undefined;

  const renderer = pdf(
    cloneElement(document, {
      measureItemRows: true,
      splittableItemRowIds: undefined,
      onRender: result => {
        // Private renderer contract documented above MeasuredNode.
        const layout = (
          result as {
            _INTERNAL__LAYOUT__DATA_?: MeasuredNode;
          }
        )._INTERNAL__LAYOUT__DATA_;

        if (!layout) {
          throw new Error('The PDF renderer did not provide layout measurements.');
        }

        splittableItemRowIds = findOversizedItemRows(layout);
      }
    })
  );

  await renderer.toBlob();

  if (!splittableItemRowIds) {
    throw new Error('PDF item measurements were not completed.');
  }

  const finalDocument = cloneElement(document, {
    measureItemRows: false,
    splittableItemRowIds
  });

  // Reuse the renderer so useId keeps the same row identifiers in both passes.
  await new Promise<void>(resolve => {
    renderer.updateContainer(finalDocument, resolve);
  });

  return renderer.toBlob();
};
