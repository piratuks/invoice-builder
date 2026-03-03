import { memo, useCallback, useDeferredValue, useEffect, useRef, useState, useTransition, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { FontFamily } from '../../shared/enums/fontFamily';
import { InvoiceFormMode } from '../../shared/enums/invoiceFormMode';
import { InvoiceStatus } from '../../shared/enums/invoiceStatus';
import { InvoiceType } from '../../shared/enums/invoiceType';
import { Language } from '../../shared/enums/language';
import { LayoutType } from '../../shared/enums/layoutType';
import { PageFormat } from '../../shared/enums/pageFormat';
import { SizeType } from '../../shared/enums/sizeType';
import { TableHeaderStyle } from '../../shared/enums/tableHeaderStyle';
import { TableRowStyle } from '../../shared/enums/tableRowStyle';
import { useStyleProfileAdd } from '../../shared/hooks/styleProfiles/useStyleProfileAdd';
import { useFormDirtyCheck } from '../../shared/hooks/useFormDirtyCheck';
import type { Invoice, InvoiceFromData } from '../../shared/types/invoice';
import type { Preset } from '../../shared/types/preset';
import type { Response } from '../../shared/types/response';
import type { StyleProfileAdd, StyleProfileFromData } from '../../shared/types/styleProfiles';
import { useAppDispatch } from '../../state/configureStore';
import { DEFAULT_TABLE_FIELD_SORT_ORDERS } from '../../state/constant';
import { addToast } from '../../state/pageSlice';
import { InvoiceForm } from './Form/index';
import { InvoicesPreview } from './Preview';

interface Props {
  invoice?: Invoice;
  type: InvoiceType;
  mode: InvoiceFormMode;
  handleChange?: (data: { invoice: InvoiceFromData; isFormValid: boolean; description?: string }) => void;
  handleDelete?: (id: number) => void;
  handleDuplicate?: (id: number, invoiceType: InvoiceType) => void;
  preset?: Preset;
}
const InvoiceFormComponent: FC<Props> = ({
  type,
  mode,
  handleChange = () => {},
  invoice,
  handleDelete = () => {},
  handleDuplicate = () => {},
  preset
}) => {
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFromData | undefined>(undefined);
  const [isFormValid, setIsFormValid] = useState(false);
  const debounceTimerRef = useRef<number | undefined>(undefined);
  const [, startTransition] = useTransition();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const initialFormRef = useRef<InvoiceFromData | undefined>(undefined);

  const [newStyleProfile, setNewStyleProfile] = useState<StyleProfileAdd | undefined>(undefined);
  const { execute: addStyleProfile, data: newRowStyleProfile } = useStyleProfileAdd({
    styleProfile: newStyleProfile,
    immediate: false,
    onDone: (data: Response<StyleProfileAdd>) => {
      setNewStyleProfile(undefined);

      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }
    }
  });

  const checkFormValid = useCallback(() => {
    if (
      invoiceForm?.businessId !== undefined &&
      invoiceForm?.clientId !== undefined &&
      invoiceForm?.currencyId !== undefined &&
      invoiceForm?.issuedAt !== undefined &&
      invoiceForm?.invoiceNumber !== undefined &&
      invoiceForm?.language !== undefined &&
      invoiceForm?.invoiceItems &&
      invoiceForm?.invoiceItems.length > 0
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [invoiceForm]);

  useFormDirtyCheck(invoiceForm, initialFormRef);

  useEffect(() => {
    startTransition(() => {
      const initial = invoice
        ? {
            ...invoice
          }
        : {
            invoiceType: type,
            status: type === InvoiceType.quotation ? InvoiceStatus.open : InvoiceStatus.unpaid,
            taxRate: 0,
            isArchived: false,
            discountAmountCents: '0',
            discountPercent: 0,
            shippingFeeCents: '0',
            invoiceItems: [],
            invoicePayments: [],
            invoiceAttachments: [],
            language: Language.en,
            invoiceCustomization: {
              color: '#006400',
              logoSize: SizeType.medium,
              fontSize: SizeType.medium,
              fontFamily: FontFamily.roboto,
              layout: LayoutType.classic,
              tableHeaderStyle: TableHeaderStyle.light,
              tableRowStyle: TableRowStyle.classic,
              pageFormat: PageFormat.a4,
              labelUpperCase: false,
              showQuantity: true,
              showUnit: true,
              showRowNo: true,
              fieldSortOrders: DEFAULT_TABLE_FIELD_SORT_ORDERS,
              pdfTexts: undefined
            }
          };

      initialFormRef.current = initial;
      setInvoiceForm(initial);
    });
  }, [invoice, type, startTransition]);

  const deferredInvoiceForm = useDeferredValue(invoiceForm);

  const handleSaveProfile = useCallback(
    (data: StyleProfileFromData) => {
      setNewStyleProfile(data);
    },
    [setNewStyleProfile]
  );

  useEffect(() => {
    if (!preset) return;
    startTransition(() => {
      setInvoiceForm(current => {
        if (!current) return current;

        return {
          ...current,
          businessId: preset.businessId ?? current.businessId,
          invoiceBusinessSnapshot: preset.businessName
            ? {
                ...current?.invoiceBusinessSnapshot,
                parentInvoiceId: current?.id,
                businessName: preset.businessName ?? current.invoiceBusinessSnapshot?.businessName,
                businessAddress: preset.businessAddress ?? current.invoiceBusinessSnapshot?.businessAddress,
                businessRole: preset.businessRole ?? current.invoiceBusinessSnapshot?.businessRole,
                businessShortName: preset.businessShortName! ?? current.invoiceBusinessSnapshot?.businessShortName,
                businessEmail: preset.businessEmail ?? current.invoiceBusinessSnapshot?.businessEmail,
                businessPhone: preset.businessPhone ?? current.invoiceBusinessSnapshot?.businessPhone,
                businessAdditional: preset.businessAdditional ?? current.invoiceBusinessSnapshot?.businessAdditional,
                businessLogo: preset.businessLogo ?? current.invoiceBusinessSnapshot?.businessLogo,
                businessFileSize: preset.businessFileSize ?? current.invoiceBusinessSnapshot?.businessFileSize,
                businessFileType: preset.businessFileType ?? current.invoiceBusinessSnapshot?.businessFileType,
                businessFileName: preset.businessFileName ?? current.invoiceBusinessSnapshot?.businessFileName,
                businessVatCode: preset.businessVatCode ?? current.invoiceBusinessSnapshot?.businessVatCode
              }
            : undefined,
          clientId: preset.clientId ?? current.clientId,
          invoiceClientSnapshot: preset.clientName
            ? {
                ...current?.invoiceClientSnapshot,
                parentInvoiceId: current?.id,
                clientName: preset.clientName ?? current.invoiceClientSnapshot?.clientName,
                clientAddress: preset.clientAddress ?? current.invoiceClientSnapshot?.clientAddress,
                clientEmail: preset.clientEmail ?? current.invoiceClientSnapshot?.clientEmail,
                clientPhone: preset.clientPhone ?? current.invoiceClientSnapshot?.clientPhone,
                clientCode: preset.clientCode ?? current.invoiceClientSnapshot?.clientCode,
                clientAdditional: preset.clientAdditional ?? current.invoiceClientSnapshot?.clientAdditional,
                clientVatCode: preset.clientVatCode ?? current.invoiceClientSnapshot?.clientVatCode
              }
            : undefined,
          bankId: preset.bankId ?? current.bankId,
          invoiceBankSnapshot: preset.bankLabel
            ? {
                ...current?.invoiceBankSnapshot,
                parentInvoiceId: current?.id,
                name: preset.bankLabel ?? current.invoiceBankSnapshot?.name,
                bankName: preset.bankName ?? current.invoiceBankSnapshot?.bankName,
                accountNumber: preset.accountNumber ?? current.invoiceBankSnapshot?.accountNumber,
                swiftCode: preset.swiftCode ?? current.invoiceBankSnapshot?.swiftCode,
                address: preset.address ?? current.invoiceBankSnapshot?.address,
                branchCode: preset.branchCode ?? current.invoiceBankSnapshot?.branchCode,
                type: preset.type ?? current.invoiceBankSnapshot?.type,
                routingNumber: preset.routingNumber ?? current.invoiceBankSnapshot?.routingNumber,
                sortOrder: preset.sortOrder ?? current.invoiceBankSnapshot?.sortOrder,
                accountHolder: preset.accountHolder ?? current.invoiceBankSnapshot?.accountHolder,
                qrCode: preset.qrCode ?? current.invoiceBankSnapshot?.qrCode,
                qrCodeFileSize: preset.qrCodeFileSize ?? current.invoiceBankSnapshot?.qrCodeFileSize,
                qrCodeFileType: preset.qrCodeFileType ?? current.invoiceBankSnapshot?.qrCodeFileType,
                qrCodeFileName: preset.qrCodeFileName ?? current.invoiceBankSnapshot?.qrCodeFileName
              }
            : undefined,
          currencyFormat: preset.currencyFormat ?? current.currencyFormat,
          currencyId: preset.currencyId ?? current.currencyId,
          invoiceCurrencySnapshot: preset.currencyCode
            ? {
                ...current?.invoiceCurrencySnapshot,
                parentInvoiceId: current.id,
                currencyCode: preset.currencyCode ?? current.invoiceCurrencySnapshot?.currencyCode,
                currencySymbol: preset.currencySymbol! ?? current.invoiceCurrencySnapshot?.currencySymbol,
                currencySubunit: preset.currencySubunit! ?? current.invoiceCurrencySnapshot?.currencySubunit
              }
            : undefined,
          styleProfilesId: preset.styleProfilesId ?? current.styleProfilesId,
          invoiceStyleProfileSnapshot: preset.styleProfileName
            ? {
                ...current?.invoiceStyleProfileSnapshot,
                parentInvoiceId: current.id,
                styleProfileName: preset.styleProfileName ?? current.invoiceStyleProfileSnapshot?.styleProfileName
              }
            : undefined,
          invoiceCustomization: preset.styleProfileName
            ? {
                ...current?.invoiceCustomization,
                parentInvoiceId: current.id,
                color: preset.styleProfileColor ?? current.invoiceCustomization?.color,
                logoSize: preset.styleProfileLogoSize ?? current.invoiceCustomization?.logoSize,
                fontSize: preset.styleProfileFontSize ?? current.invoiceCustomization?.fontSize,
                fontFamily: preset.styleProfileFontFamily ?? current.invoiceCustomization?.fontFamily,
                layout: preset.styleProfileLayout ?? current.invoiceCustomization?.layout,
                tableHeaderStyle: preset.styleProfileTableHeaderStyle ?? current.invoiceCustomization?.tableHeaderStyle,
                tableRowStyle: preset.styleProfileTableRowStyle ?? current.invoiceCustomization?.tableRowStyle,
                pageFormat: preset.styleProfilePageFormat ?? current.invoiceCustomization?.pageFormat,
                labelUpperCase: preset.styleProfileLabelUpperCase ?? current.invoiceCustomization?.labelUpperCase,
                watermarkFileName:
                  preset.styleProfileWatermarkFileName ?? current.invoiceCustomization?.watermarkFileName,
                watermarkFileType:
                  preset.styleProfileWatermarkFileType ?? current.invoiceCustomization?.watermarkFileType,
                watermarkFileSize:
                  preset.styleProfileWatermarkFileSize ?? current.invoiceCustomization?.watermarkFileSize,
                watermarkFileData:
                  preset.styleProfileWatermarkFileData ?? current.invoiceCustomization?.watermarkFileData,
                paidWatermarkFileName:
                  preset.styleProfilePaidWatermarkFileName ?? current.invoiceCustomization?.paidWatermarkFileName,
                paidWatermarkFileType:
                  preset.styleProfilePaidWatermarkFileType ?? current.invoiceCustomization?.paidWatermarkFileType,
                paidWatermarkFileSize:
                  preset.styleProfilePaidWatermarkFileSize ?? current.invoiceCustomization?.paidWatermarkFileSize,
                paidWatermarkFileData:
                  preset.styleProfilePaidWatermarkFileData ?? current.invoiceCustomization?.paidWatermarkFileData,
                showQuantity: preset.styleProfileShowQuantity ?? current.invoiceCustomization?.showQuantity,
                showUnit: preset.styleProfileShowUnit ?? current.invoiceCustomization?.showUnit,
                showRowNo: preset.styleProfileShowRowNo ?? current.invoiceCustomization?.showRowNo,
                fieldSortOrders:
                  preset.styleProfileFieldSortOrders ??
                  current.invoiceCustomization?.fieldSortOrders ??
                  DEFAULT_TABLE_FIELD_SORT_ORDERS,
                pdfTexts: preset.styleProfilePdfTexts ?? current.invoiceCustomization?.pdfTexts
              }
            : undefined,
          customerNotes: preset.customerNotes ?? current.customerNotes,
          thanksNotes: preset.thanksNotes ?? current.thanksNotes,
          termsConditionNotes: preset.termsConditionNotes ?? current.termsConditionNotes,
          language: preset.language ?? current.language,
          signatureData: preset.signatureData ?? current.signatureData,
          signatureSize: preset.signatureSize ?? current.signatureSize,
          signatureType: preset.signatureType ?? current.signatureType,
          signatureName: preset.signatureName ?? current.signatureName
        };
      });
    });
  }, [preset, startTransition]);

  useEffect(() => {
    if (newStyleProfile && newRowStyleProfile && invoiceForm) {
      setInvoiceForm({
        ...invoiceForm,
        invoiceStyleProfileSnapshot: {
          ...invoiceForm.invoiceStyleProfileSnapshot,
          styleProfileName: newRowStyleProfile.name
        },
        styleProfilesId: newRowStyleProfile.id
      });
    }
  }, [newStyleProfile, newRowStyleProfile, invoiceForm]);

  useEffect(() => {
    checkFormValid();
  }, [invoiceForm, checkFormValid]);

  useEffect(() => {
    if (newStyleProfile !== undefined) addStyleProfile();
  }, [newStyleProfile, addStyleProfile]);

  useEffect(() => {
    if (!invoiceForm) return;

    if (debounceTimerRef.current !== undefined) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      handleChange({
        invoice: invoiceForm,
        isFormValid,
        description: t('common.invalidForm')
      });
    }, 250);

    return () => {
      if (debounceTimerRef.current !== undefined) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [invoiceForm, isFormValid, t, handleChange]);

  if (mode === InvoiceFormMode.edit) {
    return (
      <InvoiceForm
        type={type}
        setInvoiceForm={setInvoiceForm}
        invoiceForm={deferredInvoiceForm}
        handleDelete={handleDelete}
        handleDuplicate={handleDuplicate}
      />
    );
  }

  return (
    <InvoicesPreview
      setInvoiceForm={setInvoiceForm}
      invoiceForm={deferredInvoiceForm}
      onSaveProfile={handleSaveProfile}
    />
  );
};

export const Form = memo(InvoiceFormComponent);
