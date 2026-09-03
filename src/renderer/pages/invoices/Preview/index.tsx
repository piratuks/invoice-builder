import ColorLensIcon from '@mui/icons-material/ColorLens';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import { Box, Fab, Tooltip } from '@mui/material';
import { memo, useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { isWebMode } from '../../../shared/api/restApi';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import { useExportPdf } from '../../../shared/hooks/fileExport/useExportPdf';
import { usePrintReceipt } from '../../../shared/hooks/print/usePrintReceipt';
import type { CustomField, CustomizationForm, InvoiceFromData } from '../../../shared/types/invoice';
import type { SortOrder } from '../../../shared/types/sortOrder';
import type { StyleProfileFromData } from '../../../shared/types/styleProfiles';
import { useAppSelector } from '../../../state/configureStore';
import { DEFAULT_TABLE_FIELD_SORT_ORDERS } from '../../../state/constant';
import { selectSettings } from '../../../state/pageSlice';
import { CustomizationDropdown } from './Dropdowns/CustomizationDropdown';
import { PreviewCore } from './PreviewCore';

interface Props {
  invoiceForm?: InvoiceFromData;
  onSaveProfile?: (data: StyleProfileFromData) => void;
  setInvoiceForm?: React.Dispatch<React.SetStateAction<InvoiceFromData | undefined>>;
}
const InvoicesPreviewComponent: FC<Props> = ({ onSaveProfile = () => {}, setInvoiceForm = () => {}, invoiceForm }) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);

  const { exportPdf } = useExportPdf({ invoiceForm, storeSettings });
  const { printReceipt } = usePrintReceipt({ invoiceForm, storeSettings });

  const [isDropdownOpenCustomization, setIsDropdownOpenCustomization] = useState<boolean>(false);

  const handleOnOpen = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  }, []);

  const handleOnClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  }, []);

  const customFieldHeaders = useMemo(() => {
    const headers =
      invoiceForm?.invoiceItems
        ?.map(item => item.customField)
        .filter((item): item is CustomField => typeof item === 'object' && item != null) ?? [];

    return [...new Set(headers)];
  }, [invoiceForm?.invoiceItems]);

  const handleOnClickCustomization = useCallback(
    (data: CustomizationForm) => {
      const { customField, layoutId, layoutSchema, ...rest } = data;
      void customField;

      setInvoiceForm({
        ...invoiceForm,
        layoutId: layoutId ?? invoiceForm?.layoutId,
        invoiceLayoutSnapshot: layoutSchema
          ? { ...invoiceForm?.invoiceLayoutSnapshot, layoutSchema: layoutSchema }
          : invoiceForm?.invoiceLayoutSnapshot,
        invoiceCustomization: {
          ...invoiceForm?.invoiceCustomization,
          ...rest,
          fieldSortOrders: Object.entries(rest.fieldSortOrders ?? DEFAULT_TABLE_FIELD_SORT_ORDERS).reduce(
            (acc, [key, value]) => {
              if (!customFieldHeaders.some(item => item.header === key)) {
                acc[key] = value;
              }
              return acc;
            },
            {} as SortOrder
          )
        },
        invoiceItems: invoiceForm?.invoiceItems?.map(item => {
          const newSortOrder = rest.fieldSortOrders
            ? rest.fieldSortOrders[item.customField?.header ?? '']
            : item.customField?.sortOrder;

          return {
            ...item,
            customField: item.customField
              ? {
                  ...item.customField,
                  ...(newSortOrder !== undefined
                    ? { sortOrder: newSortOrder }
                    : { sortOrder: item.customField.sortOrder })
                }
              : item.customField
          };
        })
      });
    },
    [setInvoiceForm, invoiceForm, customFieldHeaders]
  );

  const customizationData = useMemo(() => {
    return {
      color: invoiceForm?.invoiceCustomization?.color,
      logoSize: invoiceForm?.invoiceCustomization?.logoSize,
      fontSize: invoiceForm?.invoiceCustomization?.fontSize,
      fontFamily: invoiceForm?.invoiceCustomization?.fontFamily,
      layoutId: invoiceForm?.layoutId,
      layoutSchema: invoiceForm?.invoiceLayoutSnapshot?.layoutSchema,
      tableHeaderStyle: invoiceForm?.invoiceCustomization?.tableHeaderStyle,
      tableRowStyle: invoiceForm?.invoiceCustomization?.tableRowStyle,
      pageFormat: invoiceForm?.invoiceCustomization?.pageFormat,
      labelUpperCase: invoiceForm?.invoiceCustomization?.labelUpperCase,
      watermarkFileName: invoiceForm?.invoiceCustomization?.watermarkFileName,
      watermarkFileType: invoiceForm?.invoiceCustomization?.watermarkFileType,
      watermarkFileSize: invoiceForm?.invoiceCustomization?.watermarkFileSize,
      watermarkFileData: invoiceForm?.invoiceCustomization?.watermarkFileData,
      paidWatermarkFileName: invoiceForm?.invoiceCustomization?.paidWatermarkFileName,
      paidWatermarkFileType: invoiceForm?.invoiceCustomization?.paidWatermarkFileType,
      paidWatermarkFileSize: invoiceForm?.invoiceCustomization?.paidWatermarkFileSize,
      paidWatermarkFileData: invoiceForm?.invoiceCustomization?.paidWatermarkFileData,
      showQuantity: invoiceForm?.invoiceCustomization?.showQuantity,
      showUnit: invoiceForm?.invoiceCustomization?.showUnit,
      showRowNo: invoiceForm?.invoiceCustomization?.showRowNo,
      fieldSortOrders: invoiceForm?.invoiceCustomization?.fieldSortOrders,
      pdfTexts: invoiceForm?.invoiceCustomization?.pdfTexts,
      customField: customFieldHeaders
    };
  }, [
    invoiceForm?.invoiceCustomization,
    invoiceForm?.invoiceLayoutSnapshot?.layoutSchema,
    invoiceForm?.layoutId,
    customFieldHeaders
  ]);

  return (
    <Box sx={{ height: '100%' }}>
      <PreviewCore invoiceForm={invoiceForm} />
      <CustomizationDropdown
        language={invoiceForm?.language}
        data={customizationData}
        isOpen={isDropdownOpenCustomization}
        onClose={() => handleOnClose(setIsDropdownOpenCustomization)}
        onOpen={() => handleOnOpen(setIsDropdownOpenCustomization)}
        onClick={handleOnClickCustomization}
        onSaveProfile={onSaveProfile}
      />
      {!isWebMode() && invoiceForm?.invoiceType !== InvoiceType.quotation && (
        <Tooltip title={t('common.printReceipt')}>
          <Fab
            color="primary"
            aria-label={t('common.printReceipt')}
            onClick={printReceipt}
            sx={{
              position: 'fixed',
              bottom: 40,
              right: 180,
              zIndex: 1000
            }}
          >
            <PrintIcon />
          </Fab>
        </Tooltip>
      )}
      <Tooltip title={t('common.exportPDF')}>
        <Fab
          color="error"
          aria-label={t('common.exportPDF')}
          onClick={exportPdf}
          sx={{
            position: 'fixed',
            bottom: 40,
            right: 110,
            zIndex: 1000
          }}
        >
          <PictureAsPdfIcon />
        </Fab>
      </Tooltip>
      <Tooltip title={t('ariaLabel.customize')}>
        <Fab
          color="secondary"
          aria-label={t('ariaLabel.customize')}
          onClick={() => handleOnOpen(setIsDropdownOpenCustomization)}
          sx={{
            position: 'fixed',
            bottom: 40,
            right: 40,
            zIndex: 1000
          }}
        >
          <ColorLensIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};
export const InvoicesPreview = memo(InvoicesPreviewComponent);
