import { Box, Typography } from '@mui/material';
import { memo, useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { DiscountType } from '../../../shared/enums/discountType';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../../../shared/enums/taxType';
import type {
  DiscountForm,
  InvoiceFromData,
  InvoicePayment,
  PaymentForm,
  SurchargeForm,
  TaxForm
} from '../../../shared/types/invoice';
import { getFinancialData, getPaidData } from '../../../shared/utils/invoiceFunctions';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';
import { AddPaymentDropdown } from './Dropdowns/AddPaymentDropdown';
import { DiscountDropdown } from './Dropdowns/DiscountDropdown';
import { PaymentListDropdown } from './Dropdowns/PaymentListDropdown';
import { ShippingFeesDropdown } from './Dropdowns/ShippingFeesDropdown';
import { SurchargeDropdown } from './Dropdowns/SurchargeDropdown';
import { TaxDropdown } from './Dropdowns/TaxDropdown';

interface Props {
  invoiceForm?: InvoiceFromData;
  onShippingFeesClick: (shippingFee: number) => void;
  onDiscountClick: (data: DiscountForm) => void;
  onTaxesClick: (data: TaxForm) => void;
  onSurchargeClick: (data: SurchargeForm) => void;
  onAddPaymentClicked: (data: PaymentForm) => void;
  onRemovePaymentClicked: (data: PaymentForm) => void;
}

const FinancialInfoComponent: FC<Props> = ({
  invoiceForm,
  onAddPaymentClicked,
  onShippingFeesClick,
  onDiscountClick,
  onTaxesClick,
  onSurchargeClick,
  onRemovePaymentClicked
}) => {
  const storeSettings = useAppSelector(selectSettings);
  const { t } = useTranslation();

  const [isDropdownOpenShippingFees, setIsDropdownOpenShippingFees] = useState<boolean>(false);
  const [isDropdownOpenDiscounts, setIsDropdownOpenDiscounts] = useState<boolean>(false);
  const [isDropdownOpenTaxes, setIsDropdownOpenTaxes] = useState<boolean>(false);
  const [isDropdownOpenSurcharge, setIsDropdownOpenSurcharge] = useState<boolean>(false);
  const [isDropdownOpenAddPayment, setIsDropdownOpenAddPayment] = useState<boolean>(false);
  const [isDropdownOpenPaymentList, setIsDropdownOpenPaymentList] = useState<boolean>(false);

  const [selectedPayment, setSelectedPayment] = useState<InvoicePayment | undefined>(undefined);
  const [isAddProcess, setIsAddProcess] = useState<boolean>(false);

  const handleOnOpen = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  }, []);

  const handleOnClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  }, []);

  const {
    formattedTotalTaxAmount,
    formattedSubTotalAmount,
    totalAmountFormatted,
    discountAmountFormatted,
    surchargeAmountFormatted,
    shippingAmountFormatted,
    totalAmountPaidFormatted,
    balanceDueFormatted,
    shippingAmount,
    surchargeAmount,
    discountAmount
  } = useMemo(
    () =>
      getFinancialData({
        storeSettings,
        currencySymbol: invoiceForm?.invoiceCurrencySnapshot?.currencySymbol,
        currencyCode: invoiceForm?.invoiceCurrencySnapshot?.currencyCode,
        currencySubunit: invoiceForm?.invoiceCurrencySnapshot?.currencySubunit ?? 0,
        currencyFormat: invoiceForm?.currencyFormat,
        invoiceItems: invoiceForm?.invoiceItems ?? [],
        discountType: invoiceForm?.discountType,
        discountAmount: Number(invoiceForm?.discountAmountCents ?? 0),
        discountPercent: invoiceForm?.discountPercent,
        taxRate: invoiceForm?.taxRate ?? 0,
        shippingAmount: Number(invoiceForm?.shippingFeeCents ?? 0),
        surchargeAmount: Number(invoiceForm?.surchargeAmountCents ?? 0),
        surchargeType: invoiceForm?.surchargeType,
        surchargePercent: invoiceForm?.surchargePercent,
        taxType: invoiceForm?.taxType,
        invoicePayments: invoiceForm?.invoicePayments ?? []
      }),
    [storeSettings, invoiceForm]
  );

  const discountData = useMemo(() => {
    return {
      discountType: invoiceForm?.discountType,
      discountAmount: discountAmount,
      discountRate: invoiceForm?.discountPercent,
      discountName: invoiceForm?.discountName
    };
  }, [discountAmount, invoiceForm]);

  const taxesData = useMemo(() => {
    return {
      taxType: invoiceForm?.taxType,
      taxRate: invoiceForm?.taxRate,
      taxName: invoiceForm?.taxName,
      invoiceItems: invoiceForm?.invoiceItems ?? []
    };
  }, [invoiceForm]);

  const surchargeData = useMemo(
    () => ({
      surchargeType: invoiceForm?.surchargeType,
      surchargeAmount: surchargeAmount,
      surchargeRate: invoiceForm?.surchargePercent,
      surchargeName: invoiceForm?.surchargeName
    }),
    [invoiceForm, surchargeAmount]
  );

  const { amountPaid } = useMemo(
    () =>
      getPaidData({
        storeSettings,
        currencyCode: invoiceForm?.invoiceCurrencySnapshot?.currencyCode,
        currencySymbol: invoiceForm?.invoiceCurrencySnapshot?.currencySymbol,
        currencySubunit: invoiceForm?.invoiceCurrencySnapshot?.currencySubunit,
        currencyFormat: invoiceForm?.currencyFormat,
        invoicePayment: selectedPayment
      }),
    [storeSettings, invoiceForm, selectedPayment]
  );

  const paymentData = useMemo(() => {
    return {
      id: selectedPayment?.id,
      paymentMethod: selectedPayment?.paymentMethod,
      paidAmount: amountPaid,
      paidAt: selectedPayment?.paidAt,
      notes: selectedPayment?.notes
    };
  }, [amountPaid, selectedPayment]);

  const hasPerItemTaxExclusive = useMemo(
    () => invoiceForm?.invoiceItems?.some(item => item.taxType === InvoiceItemTaxType.exclusive),
    [invoiceForm]
  );

  const hasPerItemTaxInclusive = useMemo(
    () => invoiceForm?.invoiceItems?.some(item => item.taxType === InvoiceItemTaxType.inclusive),
    [invoiceForm]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'end',
        justifyContent: 'end',
        width: '100%',
        pt: 2,
        pb: 2,
        pl: 2,
        pr: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          alignItems: 'end'
        }}
      >
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {t('invoices.subTotal')}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {invoiceForm?.discountType === DiscountType.percentage &&
            t('invoices.discountPrct', { prct: invoiceForm.discountPercent })}

          {invoiceForm?.discountType !== DiscountType.percentage && t('invoices.discount')}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {(invoiceForm?.taxType === InvoiceTaxType.deducted || invoiceForm?.taxType === InvoiceTaxType.exclusive) &&
            (invoiceForm.taxName
              ? t('invoices.taxExclusive', {
                  name: invoiceForm.taxName,
                  prct: invoiceForm.taxRate
                })
              : t('invoices.tax', {
                  prct: invoiceForm.taxRate
                }))}
          {invoiceForm?.taxType === InvoiceTaxType.inclusive &&
            (invoiceForm.taxName
              ? t('invoices.taxInclusive', {
                  name: invoiceForm.taxName,
                  prct: invoiceForm.taxRate
                })
              : t('invoices.taxInclusivePlaceholder', {
                  prct: invoiceForm.taxRate
                }))}
          {hasPerItemTaxExclusive && t('invoices.taxExclusivePerItem')}
          {hasPerItemTaxInclusive && t('invoices.taxInclusivePerItem')}
          {!hasPerItemTaxExclusive &&
            !hasPerItemTaxInclusive &&
            !invoiceForm?.taxType &&
            t('invoices.tax', { prct: invoiceForm?.taxRate ?? 0 })}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {t('invoices.shippingFee')}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {invoiceForm?.surchargeType === DiscountType.percentage &&
            t('invoices.surchargePrct', { prct: invoiceForm.surchargePercent })}

          {invoiceForm?.surchargeType !== DiscountType.percentage && t('invoices.surcharge')}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {t('common.total')}
        </Typography>
        {invoiceForm?.invoiceType === InvoiceType.invoice && (
          <Typography
            component="div"
            variant="body1"
            sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {t('invoices.paid')}
          </Typography>
        )}
        {invoiceForm?.invoiceType === InvoiceType.invoice && (
          <Typography
            component="div"
            variant="body1"
            sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {t('invoices.balanceDue')}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          alignItems: 'end'
        }}
      >
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {formattedSubTotalAmount}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: 'underline',
            textUnderlineOffset: '5px',
            cursor: 'pointer'
          }}
          onClick={() => handleOnOpen(setIsDropdownOpenDiscounts)}
        >
          {discountAmountFormatted}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: 'underline',
            textUnderlineOffset: '5px',
            cursor: 'pointer'
          }}
          onClick={() => handleOnOpen(setIsDropdownOpenTaxes)}
        >
          {formattedTotalTaxAmount}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: 'underline',
            textUnderlineOffset: '5px',
            cursor: 'pointer'
          }}
          onClick={() => handleOnOpen(setIsDropdownOpenShippingFees)}
        >
          {shippingAmountFormatted}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: 'underline',
            textUnderlineOffset: '5px',
            cursor: 'pointer'
          }}
          onClick={() => handleOnOpen(setIsDropdownOpenSurcharge)}
        >
          {surchargeAmountFormatted}
        </Typography>
        <Typography
          component="div"
          variant="body1"
          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {totalAmountFormatted}
        </Typography>
        {invoiceForm?.invoiceType === InvoiceType.invoice && (
          <Typography
            component="div"
            variant="body1"
            sx={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textDecoration: 'underline',
              textUnderlineOffset: '5px',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (invoiceForm?.invoicePayments && invoiceForm?.invoicePayments?.length <= 0) {
                handleOnOpen(setIsDropdownOpenAddPayment);
              } else {
                handleOnOpen(setIsDropdownOpenPaymentList);
              }
            }}
          >
            {totalAmountPaidFormatted}
          </Typography>
        )}
        {invoiceForm?.invoiceType === InvoiceType.invoice && (
          <Typography
            component="div"
            variant="body1"
            sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {balanceDueFormatted}
          </Typography>
        )}
      </Box>

      <ShippingFeesDropdown
        isOpen={isDropdownOpenShippingFees}
        onClose={() => handleOnClose(setIsDropdownOpenShippingFees)}
        onOpen={() => handleOnOpen(setIsDropdownOpenShippingFees)}
        onClick={data => {
          handleOnClose(setIsDropdownOpenShippingFees);
          onShippingFeesClick(data);
        }}
        currShippingFee={shippingAmount}
      />
      <DiscountDropdown
        isOpen={isDropdownOpenDiscounts}
        onClose={() => handleOnClose(setIsDropdownOpenDiscounts)}
        onOpen={() => handleOnOpen(setIsDropdownOpenDiscounts)}
        onClick={data => {
          handleOnClose(setIsDropdownOpenDiscounts);
          onDiscountClick(data);
        }}
        data={discountData}
      />
      <TaxDropdown
        isOpen={isDropdownOpenTaxes}
        onClose={() => handleOnClose(setIsDropdownOpenTaxes)}
        onOpen={() => handleOnOpen(setIsDropdownOpenTaxes)}
        onClick={data => {
          handleOnClose(setIsDropdownOpenTaxes);
          onTaxesClick(data);
        }}
        data={taxesData}
      />
      <SurchargeDropdown
        isOpen={isDropdownOpenSurcharge}
        onClose={() => handleOnClose(setIsDropdownOpenSurcharge)}
        onOpen={() => handleOnOpen(setIsDropdownOpenSurcharge)}
        data={surchargeData}
        onClick={data => {
          handleOnClose(setIsDropdownOpenSurcharge);
          onSurchargeClick(data);
        }}
      />
      <AddPaymentDropdown
        isOpen={isDropdownOpenAddPayment}
        onClose={() => {
          if (selectedPayment) {
            setSelectedPayment(undefined);
            handleOnOpen(setIsDropdownOpenPaymentList);
          }
          handleOnClose(setIsDropdownOpenAddPayment);
        }}
        onOpen={() => handleOnOpen(setIsDropdownOpenAddPayment)}
        data={paymentData}
        onClick={data => {
          if (selectedPayment || isAddProcess) {
            setSelectedPayment(undefined);
            setIsAddProcess(false);
            handleOnOpen(setIsDropdownOpenPaymentList);
          }
          handleOnClose(setIsDropdownOpenAddPayment);
          onAddPaymentClicked(data);
        }}
      />
      <PaymentListDropdown
        isOpen={isDropdownOpenPaymentList}
        data={invoiceForm?.invoicePayments ?? []}
        onClose={() => handleOnClose(setIsDropdownOpenPaymentList)}
        onOpen={() => handleOnOpen(setIsDropdownOpenPaymentList)}
        invoiceForm={invoiceForm}
        onRemove={data => {
          onRemovePaymentClicked(data);
        }}
        onAdd={() => {
          setIsAddProcess(true);
          handleOnClose(setIsDropdownOpenPaymentList);
          handleOnOpen(setIsDropdownOpenAddPayment);
        }}
        onClick={data => {
          handleOnClose(setIsDropdownOpenPaymentList);
          handleOnOpen(setIsDropdownOpenAddPayment);
          setSelectedPayment(data);
        }}
      />
    </Box>
  );
};

export const FinancialInfo = memo(FinancialInfoComponent);
