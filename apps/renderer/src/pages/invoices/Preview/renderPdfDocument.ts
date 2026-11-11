import { pdf } from '@react-pdf/renderer';
import { cloneElement, type ComponentProps, type ReactElement } from 'react';
import type { PDFDocument } from './PDFDocument';

type InvoicePdfElement = ReactElement<ComponentProps<typeof PDFDocument>>;

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
  const invoice = document.props.invoiceForm;
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
        // React-pdf exposes geometry through an internal callback field.
        // Recheck this integration when upgrading the PDF renderer.
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
