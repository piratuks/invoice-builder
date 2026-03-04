import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Divider, Fab, Tooltip } from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState, useTransition, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { EInvoice } from '../../../shared/enums/einvoice';
import { InvoiceStatus } from '../../../shared/enums/invoiceStatus';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import type { Language } from '../../../shared/enums/language';
import { useExportPdf } from '../../../shared/hooks/fileExport/useExportPdf';
import { useExportPdfWithXml } from '../../../shared/hooks/fileExport/useExportPdfWithXml';
import { useExportXML } from '../../../shared/hooks/fileExport/useExportXML';
import { useGetEInvoiceXML } from '../../../shared/hooks/invoices/useGetEInvoiceXML';
import type { Bank } from '../../../shared/types/bank';
import type { Business } from '../../../shared/types/business';
import type { Client } from '../../../shared/types/client';
import type { Currency } from '../../../shared/types/currency';
import type {
  AttachmentForm,
  CustomFieldMeta,
  DiscountForm,
  InvoiceFromData,
  InvoiceInfo,
  InvoiceItem,
  ItemForm,
  PaymentForm,
  SignatureForm,
  TaxForm
} from '../../../shared/types/invoice';
import type { Item } from '../../../shared/types/item';
import type { Response } from '../../../shared/types/response';
import type { StyleProfile } from '../../../shared/types/styleProfiles';
import { getInvoiceTotal, getPaidAmount } from '../../../shared/utils/invoiceFunctions';
import { useAppDispatch, useAppSelector } from '../../../state/configureStore';
import { addToast, selectSettings } from '../../../state/pageSlice';
import { NotesSelector } from './../Form/NotesSelector';
import { StatusSelector } from './../Form/StatusSelector';
import { AttachmentsList } from './AttachmentsList';
import { BusinessSelector } from './BusinessSelector';
import { ClientInvoiceRow } from './ClientInvoiceRow';
import { BanksDropdown } from './Dropdowns/BanksDropdown';
import { BusinessesDropdown } from './Dropdowns/BusinessesDropdown';
import { ClientsDropdown } from './Dropdowns/ClientsDropdown';
import { CurrenciesDropdown } from './Dropdowns/CurrenciesDropdown';
import { InvoiceInformationDropdown } from './Dropdowns/InvoiceInformationDropdown';
import { ItemsDropdown } from './Dropdowns/ItemsDropdown';
import { LanguageDropdown } from './Dropdowns/LanguageDropdown';
import { MoreActionDropdown } from './Dropdowns/MoreActionDropdown';
import { StyleProfilesDropdown } from './Dropdowns/StyleProfilesDropdown';
import { FinancialInfo } from './FinancialInfo';
import { ItemSelector } from './ItemSelector';
import { ItemsList } from './ItemsList';
import { ItemMetadataSetter } from './Modals/ItemMetadataSetter';
import { SignatureSelector } from './SignatureSelector';
import { TopRow } from './TopRow';

interface Props {
  invoiceForm?: InvoiceFromData;
  type: InvoiceType;
  setInvoiceForm?: React.Dispatch<React.SetStateAction<InvoiceFromData | undefined>>;
  handleDelete?: (id: number) => void;
  handleDuplicate?: (id: number, invoiceType: InvoiceType) => void;
}
const InvoiceFormComponent: FC<Props> = ({
  invoiceForm,
  type,
  setInvoiceForm = () => {},
  handleDelete = () => {},
  handleDuplicate = () => {}
}) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);

  const { exportPdf } = useExportPdf({ invoiceForm, storeSettings });

  const [isDropdownOpenLanguages, setIsDropdownOpenLanguages] = useState<boolean>(false);
  const [isDropdownOpenBusinesses, setIsDropdownOpenBusinesses] = useState<boolean>(false);
  const [isDropdownOpenCurrencies, setIsDropdownOpenCurrencies] = useState<boolean>(false);
  const [isDropdownOpenStyleProfile, setIsDropdownOpenStyleProfile] = useState<boolean>(false);
  const [isDropdownOpenBanks, setIsDropdownOpenBanks] = useState<boolean>(false);
  const [isDropdownOpenClients, setIsDropdownOpenClients] = useState<boolean>(false);
  const [isDropdownOpenInvoiceInfo, setIsDropdownOpenInvoiceInfo] = useState<boolean>(false);
  const [isDropdownOpenMoreAction, setMoreActionDropdown] = useState<boolean>(false);
  const [isDropdownOpenItems, setIsDropdownOpenItems] = useState<boolean>(false);
  const [isModalItemMetadataOpen, setIsModalItemMetadataOpen] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const [selectedInvoiceItem, setSelectedInvoiceItem] = useState<InvoiceItem | undefined>(undefined);

  const [xmlData, setXMLData] = useState<
    { invoiceId: number; einvoice: EInvoice; type: 'singleFile' | 'embeddedFile' } | undefined
  >(undefined);
  const { exportXML } = useExportXML({ invoiceForm, storeSettings });
  const { exportPdfWithXml } = useExportPdfWithXml({ invoiceForm, storeSettings });

  const dispatch = useAppDispatch();
  const { execute: retrieveXML } = useGetEInvoiceXML({
    params: xmlData,
    immediate: false,
    onDone: (data: Response<Uint8Array | undefined>) => {
      if (!data.success) {
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      }

      if (xmlData && data.data && xmlData.type === 'singleFile') {
        exportXML(data.data, xmlData?.einvoice);
      } else if (xmlData && data.data && xmlData.type === 'embeddedFile') {
        exportPdfWithXml(data.data);
      }
    }
  });

  const invoiceInformation = useMemo(
    () => ({
      id: invoiceForm?.id,
      invoiceType: invoiceForm?.invoiceType,
      issuedAt: invoiceForm?.issuedAt,
      invoiceNumber: invoiceForm?.invoiceNumber,
      dueDate: invoiceForm?.dueDate,
      invoicePrefix: invoiceForm?.invoicePrefix,
      invoiceSuffix: invoiceForm?.invoiceSuffix,
      businessId: invoiceForm?.businessId,
      clientId: invoiceForm?.clientId
    }),
    [
      invoiceForm?.id,
      invoiceForm?.invoiceType,
      invoiceForm?.issuedAt,
      invoiceForm?.invoiceNumber,
      invoiceForm?.dueDate,
      invoiceForm?.invoicePrefix,
      invoiceForm?.invoiceSuffix,
      invoiceForm?.businessId,
      invoiceForm?.clientId
    ]
  );

  const businessFormData = useMemo(
    () => ({
      businessLogo: invoiceForm?.invoiceBusinessSnapshot?.businessLogo,
      businessFileType: invoiceForm?.invoiceBusinessSnapshot?.businessFileType,
      businessName: invoiceForm?.invoiceBusinessSnapshot?.businessName,
      businessShortName: invoiceForm?.invoiceBusinessSnapshot?.businessShortName
    }),
    [invoiceForm?.invoiceBusinessSnapshot]
  );

  const signatureFormData = useMemo(
    () => ({
      signatureData: invoiceForm?.signatureData,
      signatureName: invoiceForm?.signatureName,
      signatureSize: invoiceForm?.signatureSize,
      signatureType: invoiceForm?.signatureType
    }),
    [invoiceForm?.signatureData, invoiceForm?.signatureName, invoiceForm?.signatureSize, invoiceForm?.signatureType]
  );

  const notesFormData = useMemo(
    () => ({
      customerNotes: invoiceForm?.customerNotes,
      thanksNotes: invoiceForm?.thanksNotes,
      termsConditionNotes: invoiceForm?.termsConditionNotes
    }),
    [invoiceForm?.termsConditionNotes, invoiceForm?.thanksNotes, invoiceForm?.customerNotes]
  );

  const customFieldHeaders = useMemo(() => {
    const headers =
      invoiceForm?.invoiceItems
        ?.map(item => {
          if (!item.customField) return undefined;
          return {
            header: item.customField.header,
            sortOrder: item.customField.sortOrder,
            alignment: item.customField.alignment
          };
        })
        .filter((item): item is CustomFieldMeta => typeof item === 'object' && item != null) ?? [];

    const uniqueHeaders = [...new Map(headers.map(h => [h.header, h])).values()];

    return uniqueHeaders;
  }, [invoiceForm?.invoiceItems]);

  const handleOnOpen = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  }, []);

  const handleOnClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  }, []);

  const handleOnClickBusiness = useCallback(
    (data: Business) => {
      handleOnClose(setIsDropdownOpenBusinesses);

      if (!invoiceForm) return;

      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          businessId: data.id,
          invoiceBusinessSnapshot: {
            ...invoiceForm?.invoiceBusinessSnapshot,
            parentInvoiceId: invoiceForm?.id,
            businessName: data.name,
            businessAddress: data.address,
            businessRole: data.role,
            businessShortName: data.shortName,
            businessEmail: data.email,
            businessPhone: data.phone,
            businessAdditional: data.additional,
            // Legacy payment info. New payment info is via Bank
            businessPaymentInformation: data.paymentInformation,
            businessLogo: data.logo ?? undefined,
            businessFileSize: data.fileSize,
            businessFileType: data.fileType,
            businessFileName: data.fileName,
            businessVatCode: data.vatCode,
            businessCountryCode: data.countryCode,
            businessCode: data.code,
            businessPeppolEndpointId: data.peppolEndpointId,
            businessPeppolEndpointSchemeId: data.peppolEndpointSchemeId
          }
        });
      });
    },
    [handleOnClose, setInvoiceForm, invoiceForm]
  );

  const handleOnClickBank = useCallback(
    (data: Bank) => {
      handleOnClose(setIsDropdownOpenBanks);

      if (!invoiceForm) return;

      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          bankId: data.id,
          invoiceBankSnapshot: {
            ...invoiceForm?.invoiceBankSnapshot,
            parentInvoiceId: invoiceForm?.id,
            name: data.name,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            swiftCode: data.swiftCode,
            address: data.address,
            branchCode: data.branchCode,
            type: data.type,
            routingNumber: data.routingNumber,
            sortOrder: data.sortOrder,
            accountHolder: data.accountHolder,
            qrCode: data.qrCode ?? undefined,
            qrCodeFileSize: data.qrCodeFileSize,
            qrCodeFileType: data.qrCodeFileType,
            qrCodeFileName: data.qrCodeFileName
          }
        });
      });
    },
    [handleOnClose, setInvoiceForm, invoiceForm]
  );

  const handleOnClickStyleProfile = useCallback(
    (data: StyleProfile) => {
      handleOnClose(setIsDropdownOpenStyleProfile);

      if (!invoiceForm) return;

      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          styleProfilesId: data.id,
          invoiceStyleProfileSnapshot: {
            ...invoiceForm?.invoiceStyleProfileSnapshot,
            parentInvoiceId: invoiceForm?.id,
            styleProfileName: data.name
          },
          invoiceCustomization: {
            ...invoiceForm?.invoiceCustomization,
            parentInvoiceId: invoiceForm?.id,
            color: data.color ?? invoiceForm.invoiceCustomization!.color,
            logoSize: data.logoSize ?? invoiceForm.invoiceCustomization!.logoSize,
            fontSize: data.fontSize ?? invoiceForm.invoiceCustomization!.fontSize,
            fontFamily: data.fontFamily ?? invoiceForm.invoiceCustomization!.fontFamily,
            layout: data.layout ?? invoiceForm.invoiceCustomization!.layout,
            tableHeaderStyle: data.tableHeaderStyle ?? invoiceForm.invoiceCustomization!.tableHeaderStyle,
            tableRowStyle: data.tableRowStyle ?? invoiceForm.invoiceCustomization!.tableRowStyle,
            pageFormat: data.pageFormat ?? invoiceForm.invoiceCustomization!.pageFormat,
            labelUpperCase: data.labelUpperCase,
            watermarkFileName: data.watermarkFileName ?? invoiceForm.invoiceCustomization?.watermarkFileName,
            watermarkFileType: data.watermarkFileType ?? invoiceForm.invoiceCustomization?.watermarkFileType,
            watermarkFileSize: data.watermarkFileSize ?? invoiceForm.invoiceCustomization?.watermarkFileSize,
            watermarkFileData: data.watermarkFileData ?? invoiceForm.invoiceCustomization?.watermarkFileData,
            paidWatermarkFileName:
              data.paidWatermarkFileName ?? invoiceForm.invoiceCustomization?.paidWatermarkFileName,
            paidWatermarkFileType:
              data.paidWatermarkFileType ?? invoiceForm.invoiceCustomization?.paidWatermarkFileType,
            paidWatermarkFileSize:
              data.paidWatermarkFileSize ?? invoiceForm.invoiceCustomization?.paidWatermarkFileSize,
            paidWatermarkFileData:
              data.paidWatermarkFileData ?? invoiceForm.invoiceCustomization?.paidWatermarkFileData,
            showQuantity: data.showQuantity,
            showUnit: data.showUnit,
            showRowNo: data.showRowNo,
            fieldSortOrders: data.fieldSortOrders,
            pdfTexts: data.pdfTexts
          }
        });
      });
    },
    [handleOnClose, setInvoiceForm, invoiceForm]
  );

  const handleOnClickCurrencies = useCallback(
    (data: Currency) => {
      handleOnClose(setIsDropdownOpenCurrencies);

      if (!invoiceForm) return;

      const prevSubunit = invoiceForm.invoiceCurrencySnapshot?.currencySubunit;
      const newSubunit = data.subunit;

      const convert = (raw: string | undefined) => {
        const value = Number(raw ?? 0);
        let result = value;

        if (prevSubunit === undefined && newSubunit !== undefined) {
          result = value * newSubunit;
        } else if (prevSubunit !== undefined && newSubunit !== undefined) {
          result = value * (newSubunit / prevSubunit);
        } else if (prevSubunit !== undefined && newSubunit === undefined) {
          result = value / prevSubunit;
        }

        if (!Number.isFinite(result) || Number.isNaN(result)) {
          return '0';
        }

        return result.toString();
      };

      const updatedItems = invoiceForm.invoiceItems?.map(it => {
        return {
          ...it,
          invoiceItemSnapshot: {
            ...it.invoiceItemSnapshot,
            unitPriceCents: convert(it.invoiceItemSnapshot.unitPriceCents)
          }
        };
      });

      const updatedPayments = invoiceForm.invoicePayments?.map(it => {
        return {
          ...it,
          amountCents: convert(it.amountCents)
        };
      });

      const updatedShippingFee = convert(invoiceForm?.shippingFeeCents);
      const updatedDiscountAmount = convert(invoiceForm?.discountAmountCents);

      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          currencyId: data.id,
          invoiceCurrencySnapshot: {
            ...invoiceForm.invoiceCurrencySnapshot,
            parentInvoiceId: invoiceForm.id!,
            currencyCode: data.code,
            currencySymbol: data.symbol,
            currencySubunit: data.subunit
          },
          currencyFormat: data.format,
          invoiceItems: updatedItems ?? invoiceForm.invoiceItems,
          invoicePayments: updatedPayments ?? invoiceForm.invoicePayments,
          shippingFeeCents: updatedShippingFee,
          discountAmountCents: updatedDiscountAmount
        });
      });
    },
    [handleOnClose, setInvoiceForm, invoiceForm]
  );

  const handleOnClickClients = useCallback(
    (data: Client) => {
      handleOnClose(setIsDropdownOpenClients);

      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          clientId: data.id,
          invoiceClientSnapshot: {
            ...invoiceForm?.invoiceClientSnapshot,
            clientName: data.name,
            clientAddress: data.address,
            clientEmail: data.email,
            clientPhone: data.phone,
            clientCode: data.code,
            clientAdditional: data.additional,
            clientVatCode: data.vatCode,
            clientCountryCode: data.countryCode,
            clientPeppolEndpointId: data.peppolEndpointId,
            clientPeppolEndpointSchemeId: data.peppolEndpointSchemeId,
            clientBuyerReference: data.buyerReference
          }
        });
      });
    },
    [handleOnClose, setInvoiceForm, invoiceForm]
  );

  const handleClickItems = useCallback(
    (item: Item, data: ItemForm) => {
      handleOnClose(setIsDropdownOpenItems);

      if (!invoiceForm) return;

      const { quantity, header, value, alignment, sortOrder, unitPrice } = data;

      const unitPriceCents =
        invoiceForm.invoiceCurrencySnapshot?.currencySubunit && unitPrice != undefined
          ? unitPrice * invoiceForm.invoiceCurrencySnapshot?.currencySubunit
          : (unitPrice ?? 0);

      const newItemID = Date.now();
      const newItem = {
        id: newItemID,
        itemId: item.id,
        invoiceItemSnapshot: {
          parentInvoiceItemId: newItemID,
          itemName: item.name,
          unitName: item.unitName,
          unitPriceCents: unitPriceCents.toString()
        },
        customField:
          header && value && alignment && sortOrder != undefined
            ? {
                header: header,
                value: value,
                alignment: alignment,
                sortOrder: sortOrder
              }
            : undefined,
        quantity: quantity?.toString() ?? '0',
        taxName: undefined,
        taxRate: 0,
        taxType: undefined
      };

      startTransition(() => {
        setInvoiceForm(prev => {
          if (!prev) return prev;

          const updatedItems = [...(prev.invoiceItems ?? []), newItem];

          if (header && alignment) {
            for (let i = 0; i < updatedItems.length; i++) {
              const cf = updatedItems[i].customField;
              if (cf?.header === header) {
                updatedItems[i] = {
                  ...updatedItems[i],
                  customField: {
                    ...cf,
                    alignment
                  }
                };
              }
            }
          }

          return {
            ...prev,
            invoiceItems: updatedItems
          };
        });
      });
    },
    [handleOnClose, setInvoiceForm, invoiceForm]
  );

  const handleDeleteItem = useCallback(
    (itemToRemove: InvoiceItem) => {
      if (!invoiceForm) return;

      startTransition(() => {
        setInvoiceForm(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            invoiceItems: (prev.invoiceItems ?? []).filter(i => i.id !== itemToRemove.id)
          };
        });
      });
    },
    [setInvoiceForm, invoiceForm]
  );

  const handleEditItem = useCallback(
    (itemToEdit: InvoiceItem) => {
      if (!invoiceForm) return;

      setSelectedInvoiceItem(itemToEdit);
      handleOnOpen(setIsModalItemMetadataOpen);
    },
    [invoiceForm, handleOnOpen]
  );

  const handleEditMetadataItem = useCallback(
    (data: ItemForm) => {
      if (!selectedInvoiceItem || !invoiceForm) return;

      const { quantity, header, value, alignment, sortOrder, unitPrice } = data;
      const unitPriceCents =
        invoiceForm.invoiceCurrencySnapshot?.currencySubunit && unitPrice != undefined
          ? unitPrice * invoiceForm.invoiceCurrencySnapshot?.currencySubunit
          : (unitPrice ?? 0);

      startTransition(() => {
        setInvoiceForm(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            invoiceItems: (prev.invoiceItems ?? []).map(item => {
              const isSelected = item.id === selectedInvoiceItem.id;
              const hasSameHeader = item.customField?.header === header;

              if (isSelected) {
                return {
                  ...item,
                  ...(quantity !== undefined && { quantity: quantity.toString() }),
                  invoiceItemSnapshot: {
                    ...item.invoiceItemSnapshot,
                    unitPriceCents: unitPriceCents.toString()
                  },
                  customField:
                    header && value && alignment && sortOrder != undefined
                      ? { header, value, alignment, sortOrder }
                      : item.customField
                };
              }
              if (hasSameHeader && alignment) {
                return {
                  ...item,
                  customField: {
                    ...item.customField!,
                    alignment
                  }
                };
              }

              return item;
            })
          };
        });
      });

      setSelectedInvoiceItem(undefined);
      handleOnClose(setIsModalItemMetadataOpen);
    },
    [invoiceForm, selectedInvoiceItem, setInvoiceForm, handleOnClose, setSelectedInvoiceItem]
  );

  const handleOnClickInvoiceInformation = useCallback(
    (data: InvoiceInfo) => {
      handleOnClose(setIsDropdownOpenInvoiceInfo);
      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          issuedAt: data.issuedAt ?? '',
          invoiceNumber: data.invoiceNumber ?? '',
          dueDate: data.dueDate,
          invoicePrefix: data.invoicePrefix,
          invoiceSuffix: data.invoiceSuffix
        });
      });
    },
    [handleOnClose, setInvoiceForm, invoiceForm]
  );

  const handleOnClickShippingFees = useCallback(
    (data: number) => {
      if (!invoiceForm) return;

      const fee = invoiceForm.invoiceCurrencySnapshot?.currencySubunit
        ? data * invoiceForm.invoiceCurrencySnapshot?.currencySubunit
        : data;
      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          shippingFeeCents: fee.toString()
        });
      });
    },
    [setInvoiceForm, invoiceForm]
  );

  const handleOnClickDiscount = useCallback(
    (data: DiscountForm) => {
      if (!invoiceForm) return;

      const discountAmount = invoiceForm.invoiceCurrencySnapshot?.currencySubunit
        ? (data.discountAmount ?? 0) * invoiceForm.invoiceCurrencySnapshot?.currencySubunit
        : data.discountAmount;
      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          discountName: data.discountName,
          discountType: data.discountType,
          discountPercent: data.discountRate ?? 0,
          discountAmountCents: discountAmount?.toString() ?? '0'
        });
      });
    },
    [setInvoiceForm, invoiceForm]
  );

  const getStatus = useCallback((newInvoiceForm: InvoiceFromData) => {
    const totalAmountPaid = getPaidAmount(newInvoiceForm?.invoicePayments ?? []);
    const totalAmount = getInvoiceTotal({
      taxRate: newInvoiceForm?.taxRate ?? 0,
      taxType: newInvoiceForm?.taxType,
      invoiceItems: newInvoiceForm?.invoiceItems ?? [],
      discountType: newInvoiceForm?.discountType,
      discountAmount: Number(newInvoiceForm?.discountAmountCents ?? 0),
      discountPercent: newInvoiceForm?.discountPercent,
      shippingFee: Number(newInvoiceForm?.shippingFeeCents ?? 0)
    });

    if (totalAmountPaid < totalAmount && totalAmountPaid > 0) {
      return InvoiceStatus.partiallyPaid;
    } else if (totalAmountPaid >= totalAmount) {
      return InvoiceStatus.paid;
    }

    return InvoiceStatus.unpaid;
  }, []);

  const handleOnClickRemovePayment = useCallback(
    (data: PaymentForm) => {
      if (!invoiceForm) return;

      const newInvoiceForm = {
        ...invoiceForm,
        invoicePayments: invoiceForm.invoicePayments?.filter(item => item.id !== data.id)
      };
      newInvoiceForm.status = getStatus(newInvoiceForm);
      startTransition(() => {
        setInvoiceForm(newInvoiceForm);
      });
    },
    [invoiceForm, setInvoiceForm, getStatus]
  );

  const handleOnClickAddPayment = useCallback(
    (data: PaymentForm) => {
      if (!invoiceForm) return;
      if (!data.paidAmount || !data.paidAt || !data.paymentMethod) return;

      const paidAmount = invoiceForm.invoiceCurrencySnapshot?.currencySubunit
        ? (data.paidAmount ?? 0) * invoiceForm.invoiceCurrencySnapshot?.currencySubunit
        : data.paidAmount;

      const payment = {
        id: Date.now(),
        paidAt: data.paidAt,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        amountCents: paidAmount
      };

      const invoicePayments = invoiceForm.invoicePayments ? [...invoiceForm.invoicePayments] : [];

      if (data.id) {
        const index = invoicePayments.findIndex(item => item.id === data.id);
        if (index !== -1) {
          invoicePayments[index] = {
            ...invoicePayments[index],
            amountCents: payment.amountCents?.toString() ?? '0'
          };
        } else {
          invoicePayments.push({
            id: payment.id,
            paidAt: payment.paidAt,
            paymentMethod: payment.paymentMethod,
            notes: payment.notes,
            amountCents: payment.amountCents?.toString() ?? '0'
          });
        }
      } else {
        invoicePayments.push({
          id: payment.id,
          paidAt: payment.paidAt,
          paymentMethod: payment.paymentMethod,
          notes: payment.notes,
          amountCents: payment.amountCents?.toString() ?? '0'
        });
      }

      const newInvoiceForm = {
        ...invoiceForm,
        invoicePayments
      };
      newInvoiceForm.status = getStatus(newInvoiceForm);
      startTransition(() => {
        setInvoiceForm(newInvoiceForm);
      });
    },
    [invoiceForm, setInvoiceForm, getStatus]
  );

  const handleOnClickTax = useCallback(
    (data: TaxForm) => {
      if (!invoiceForm) return;
      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          taxName: data.taxName,
          taxRate: data.taxRate,
          taxType: data.taxType,
          invoiceItems: data.invoiceItems
        });
      });
    },
    [setInvoiceForm, invoiceForm]
  );

  const handleSignature = useCallback(
    (data: SignatureForm) => {
      if (!invoiceForm) return;

      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          signatureData: data.data,
          signatureName: data.name,
          signatureType: data.type,
          signatureSize: data.size
        });
      });
    },
    [setInvoiceForm, invoiceForm]
  );

  const handleAttachments = useCallback(
    (data: AttachmentForm) => {
      if (!invoiceForm) return;

      const invoiceAttachments = invoiceForm.invoiceAttachments ? [...invoiceForm.invoiceAttachments] : [];

      invoiceAttachments.push({
        id: Date.now(),
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        data: data.data
      });
      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          invoiceAttachments: invoiceAttachments
        });
      });
    },
    [setInvoiceForm, invoiceForm]
  );

  const handleRemoveAttachment = useCallback(
    (data: number) => {
      if (!invoiceForm) return;

      const invoiceAttachments = invoiceForm.invoiceAttachments
        ? [...invoiceForm.invoiceAttachments.filter(ia => ia.id !== data)]
        : [];
      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          invoiceAttachments: invoiceAttachments
        });
      });
    },
    [setInvoiceForm, invoiceForm]
  );

  const handleOnClickLanguage = useCallback(
    (data: Language) => {
      handleOnClose(setIsDropdownOpenLanguages);

      if (!invoiceForm) return;

      startTransition(() => {
        setInvoiceForm({
          ...invoiceForm,
          language: data
        });
      });
    },
    [setInvoiceForm, invoiceForm, handleOnClose]
  );

  useEffect(() => {
    if (xmlData) {
      retrieveXML();
    }
  }, [xmlData, retrieveXML]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 2
      }}
    >
      <Divider flexItem />
      <TopRow
        onEditBank={() => handleOnOpen(setIsDropdownOpenBanks)}
        onEditCurrency={() => handleOnOpen(setIsDropdownOpenCurrencies)}
        onEditLanguage={() => handleOnOpen(setIsDropdownOpenLanguages)}
        onEditStyleProfile={() => handleOnOpen(setIsDropdownOpenStyleProfile)}
        invoiceForm={invoiceForm}
      />
      <Divider flexItem />
      <BusinessSelector onEdit={() => handleOnOpen(setIsDropdownOpenBusinesses)} data={businessFormData} />
      <Divider flexItem />
      <ClientInvoiceRow
        onEditClients={() => handleOnOpen(setIsDropdownOpenClients)}
        onEditInvoiceInfo={() => handleOnOpen(setIsDropdownOpenInvoiceInfo)}
        invoiceForm={invoiceForm}
        type={type}
      />

      <Divider flexItem />

      <ItemsList
        invoiceForm={invoiceForm}
        setInvoiceForm={setInvoiceForm}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      {invoiceForm?.invoiceItems && invoiceForm?.invoiceItems?.length > 0 && <Divider flexItem />}

      <ItemSelector onEdit={() => handleOnOpen(setIsDropdownOpenItems)} />

      {invoiceForm?.invoiceItems && invoiceForm?.invoiceItems?.length > 0 && (
        <>
          <FinancialInfo
            invoiceForm={invoiceForm}
            onShippingFeesClick={handleOnClickShippingFees}
            onDiscountClick={handleOnClickDiscount}
            onTaxesClick={handleOnClickTax}
            onAddPaymentClicked={handleOnClickAddPayment}
            onRemovePaymentClicked={handleOnClickRemovePayment}
          />
          <Divider flexItem />
          <StatusSelector
            invoiceForm={invoiceForm}
            onArchivedChanged={value => {
              startTransition(() => {
                setInvoiceForm(prev => ({ ...prev, isArchived: value }));
              });
            }}
            onStatusChanged={value => {
              startTransition(() => {
                setInvoiceForm(prev => ({ ...prev, status: value }));
              });
            }}
          />
          <Divider flexItem />
          <NotesSelector
            data={notesFormData}
            onCustomerNotesChanged={value => {
              startTransition(() => {
                setInvoiceForm(prev => ({ ...prev, customerNotes: value }));
              });
            }}
            onThanksNotesChanged={value => {
              startTransition(() => {
                setInvoiceForm(prev => ({ ...prev, thanksNotes: value }));
              });
            }}
            onTermsConditionsNotesChanged={value => {
              startTransition(() => {
                setInvoiceForm(prev => ({ ...prev, termsConditionNotes: value }));
              });
            }}
          />
          <SignatureSelector data={signatureFormData} onEdit={handleSignature} />

          <Divider flexItem />

          <AttachmentsList invoiceForm={invoiceForm} onAttach={handleAttachments} onClear={handleRemoveAttachment} />
        </>
      )}

      <LanguageDropdown
        isOpen={isDropdownOpenLanguages}
        onClose={() => handleOnClose(setIsDropdownOpenLanguages)}
        onOpen={() => handleOnOpen(setIsDropdownOpenLanguages)}
        onClick={handleOnClickLanguage}
      />
      <BusinessesDropdown
        isOpen={isDropdownOpenBusinesses}
        onClose={() => handleOnClose(setIsDropdownOpenBusinesses)}
        onOpen={() => handleOnOpen(setIsDropdownOpenBusinesses)}
        onClick={handleOnClickBusiness}
      />
      <StyleProfilesDropdown
        isOpen={isDropdownOpenStyleProfile}
        onClose={() => handleOnClose(setIsDropdownOpenStyleProfile)}
        onOpen={() => handleOnOpen(setIsDropdownOpenStyleProfile)}
        onClick={handleOnClickStyleProfile}
      />
      <BanksDropdown
        isOpen={isDropdownOpenBanks}
        onClose={() => handleOnClose(setIsDropdownOpenBanks)}
        onOpen={() => handleOnOpen(setIsDropdownOpenBanks)}
        onClick={handleOnClickBank}
      />
      <CurrenciesDropdown
        isOpen={isDropdownOpenCurrencies}
        onClose={() => handleOnClose(setIsDropdownOpenCurrencies)}
        onOpen={() => handleOnOpen(setIsDropdownOpenCurrencies)}
        onClick={handleOnClickCurrencies}
      />
      <ClientsDropdown
        isOpen={isDropdownOpenClients}
        onClose={() => handleOnClose(setIsDropdownOpenClients)}
        onOpen={() => handleOnOpen(setIsDropdownOpenClients)}
        onClick={handleOnClickClients}
      />
      <ItemsDropdown
        isOpen={isDropdownOpenItems}
        type={type}
        headerOptions={customFieldHeaders}
        onClose={() => handleOnClose(setIsDropdownOpenItems)}
        onOpen={() => handleOnOpen(setIsDropdownOpenItems)}
        onClick={handleClickItems}
      />
      {isDropdownOpenInvoiceInfo && (
        <InvoiceInformationDropdown
          information={invoiceInformation}
          isOpen={isDropdownOpenInvoiceInfo}
          onClose={() => handleOnClose(setIsDropdownOpenInvoiceInfo)}
          onOpen={() => handleOnOpen(setIsDropdownOpenInvoiceInfo)}
          onClick={handleOnClickInvoiceInformation}
        />
      )}
      <MoreActionDropdown
        type={type}
        isOpen={isDropdownOpenMoreAction}
        isPDFReady={invoiceForm?.id != undefined}
        onClose={() => handleOnClose(setMoreActionDropdown)}
        onOpen={() => handleOnOpen(setMoreActionDropdown)}
        onDelete={() => {
          handleOnClose(setMoreActionDropdown);
          if (invoiceForm?.id !== undefined) handleDelete(invoiceForm.id);
        }}
        onDuplicate={() => {
          handleOnClose(setMoreActionDropdown);
          if (invoiceForm?.id !== undefined) handleDuplicate(invoiceForm.id, type);
        }}
        onMakeInvoice={() => {
          handleOnClose(setMoreActionDropdown);
          if (invoiceForm?.id !== undefined) handleDuplicate(invoiceForm.id, InvoiceType.invoice);
        }}
        onExportPDF={() => {
          handleOnClose(setMoreActionDropdown);
          exportPdf();
        }}
        onExportPDFUBL={() => {
          handleOnClose(setMoreActionDropdown);
          if (invoiceForm?.id)
            setXMLData({ invoiceId: invoiceForm.id, einvoice: EInvoice.ubl21, type: 'embeddedFile' });
        }}
        onExportUBLXML={() => {
          handleOnClose(setMoreActionDropdown);
          if (invoiceForm?.id) setXMLData({ invoiceId: invoiceForm.id, einvoice: EInvoice.ubl21, type: 'singleFile' });
        }}
        showDelete={invoiceForm?.id !== undefined}
        showDuplicate={invoiceForm?.id !== undefined}
        showMakeInvoice={invoiceForm?.id !== undefined && invoiceForm.invoiceType === InvoiceType.quotation}
      />

      <ItemMetadataSetter
        isOpen={isModalItemMetadataOpen}
        onCancel={() => handleOnClose(setIsModalItemMetadataOpen)}
        currQuantity={selectedInvoiceItem?.quantity}
        currUnitPrice={Number(
          invoiceForm?.invoiceCurrencySnapshot?.currencySubunit != undefined
            ? Number(selectedInvoiceItem?.invoiceItemSnapshot.unitPriceCents ?? 0) /
                invoiceForm?.invoiceCurrencySnapshot?.currencySubunit
            : 0
        )}
        customField={selectedInvoiceItem?.customField}
        type={type}
        headerOptions={customFieldHeaders}
        onSave={handleEditMetadataItem}
      />

      <Tooltip title={t('ariaLabel.moreActions')}>
        <Fab
          color="primary"
          aria-label={t('ariaLabel.moreActions')}
          onClick={() => handleOnOpen(setMoreActionDropdown)}
          sx={{
            position: 'fixed',
            bottom: 40,
            right: 40,
            zIndex: 1000
          }}
        >
          <MoreVertIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export const InvoiceForm = memo(InvoiceFormComponent);
