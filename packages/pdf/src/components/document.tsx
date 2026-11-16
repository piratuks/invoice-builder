import { createElement, type FC } from 'react';
import { PDFDocument } from './PDFDocument.js';
import type { InvoicePdfInput } from '../types.js';
import type { ComponentProps } from 'react';

export interface InvoicePdfDocumentProps {
  input: InvoicePdfInput;
  measureItemRows?: boolean;
  splittableItemRowIds?: ReadonlySet<string>;
  onRender?: ComponentProps<typeof PDFDocument>['onRender'];
}

export const InvoicePdfDocument: FC<InvoicePdfDocumentProps> = ({
  input,
  measureItemRows,
  splittableItemRowIds,
  onRender
}) =>
  createElement(PDFDocument, {
    ...input,
    measureItemRows,
    splittableItemRowIds,
    onRender
  });
