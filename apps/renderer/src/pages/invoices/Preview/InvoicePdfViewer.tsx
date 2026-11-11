import { Alert, Box, CircularProgress } from '@mui/material';
import { PDFViewer } from '@react-pdf/renderer';
import { useEffect, useState, type ComponentProps, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { PDFDocument } from './PDFDocument';
import { renderPdfDocument } from './renderPdfDocument';

interface Props {
  children: ReactElement<ComponentProps<typeof PDFDocument>>;
}

const MeasuredPreview = ({ children }: Props) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<{
    document?: Props['children'];
    url?: string;
    error?: string;
  }>({});

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      try {
        const blob = await renderPdfDocument(children);

        if (!cancelled) {
          setResult({
            document: children,
            url: URL.createObjectURL(blob)
          });
        }
      } catch (error) {
        if (!cancelled) {
          setResult({
            document: children,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    };

    void generate();

    return () => {
      cancelled = true;
    };
  }, [children]);

  useEffect(() => {
    const url = result.url;

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [result.url]);

  if (result.document !== children) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: 160
        }}
      >
        <CircularProgress aria-label={t('ariaLabel.preview')} />
      </Box>
    );
  }

  if (result.error) {
    return <Alert severity="error">{result.error}</Alert>;
  }

  if (!result.url) return null;

  return (
    <iframe
      title={t('ariaLabel.preview')}
      src={`${result.url}#toolbar=0`}
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
};

export const InvoicePdfViewer = ({ children }: Props) => {
  const invoice = children.props.invoiceForm;
  const hasVisibleDescriptions =
    invoice?.invoiceCustomization?.showItemDescriptions === true &&
    invoice.invoiceItems?.some(item => Boolean(item.invoiceItemSnapshot.itemDescription?.trim()));

  if (hasVisibleDescriptions) {
    return <MeasuredPreview>{children}</MeasuredPreview>;
  }

  return (
    <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} showToolbar={false}>
      {children}
    </PDFViewer>
  );
};
