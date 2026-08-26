import { Text, View } from '@react-pdf/renderer';
import { memo, useMemo, type FC } from 'react';
import { DiscountType } from '../../../shared/enums/discountType';
import { InvoiceStatus } from '../../../shared/enums/invoiceStatus';
import { InvoiceType } from '../../../shared/enums/invoiceType';
import { InvoiceItemTaxType, InvoiceTaxType } from '../../../shared/enums/taxType';
import type { InvoiceFromData } from '../../../shared/types/invoice';
import type { Settings } from '../../../shared/types/settings';
import { getFinancialData } from '../../../shared/utils/invoiceFunctions';
import { DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';

interface PropsLabels {
  subTotalLabel: string;
  discountLabel: string;
  surchargeLabel: string;
  incLabel: string;
  taxLabel: string;
  taxExclusivePerItemLabel: string;
  taxInclusivePerItemLabel: string;
  shippingFeeLabel: string;
  totalLabel: string;
  paidLabel: string;
  balanceDueLabel: string;
}
interface Props {
  invoiceForm?: InvoiceFromData;
  storeSettings?: Settings;
  labels: PropsLabels;
}
const FinancialInfoComponent: FC<Props> = ({ invoiceForm, storeSettings, labels }) => {
  const {
    formattedTotalTaxAmount,
    formattedSubTotalAmount,
    totalAmountFormatted,
    discountAmountFormatted,
    shippingAmountFormatted,
    surchargeAmountFormatted,
    totalAmountPaidFormatted,
    balanceDueFormatted,
    shippingAmount,
    surchargeAmount,
    discountAmount,
    totalTax,
    totalAmountPaid
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
        surchargeType: invoiceForm?.surchargeType,
        surchargeAmount: Number(invoiceForm?.surchargeAmountCents ?? 0),
        surchargePercent: invoiceForm?.surchargePercent,
        taxType: invoiceForm?.taxType,
        invoicePayments: invoiceForm?.invoicePayments ?? []
      }),
    [storeSettings, invoiceForm]
  );

  const {
    subTotalLabel,
    discountLabel,
    surchargeLabel,
    incLabel,
    taxLabel,
    taxExclusivePerItemLabel,
    taxInclusivePerItemLabel,
    shippingFeeLabel,
    totalLabel,
    paidLabel,
    balanceDueLabel
  } = labels;

  const hasPerItemTaxExclusive = useMemo(
    () => invoiceForm?.invoiceItems?.some(item => item.taxType === InvoiceItemTaxType.exclusive),
    [invoiceForm]
  );

  const hasPerItemTaxInclusive = useMemo(
    () => invoiceForm?.invoiceItems?.some(item => item.taxType === InvoiceItemTaxType.inclusive),
    [invoiceForm]
  );

  return (
    <View style={PDF_STYLES.w50}>
      {(discountAmount > 0 || Math.abs(totalTax) > 0 || shippingAmount > 0 || surchargeAmount > 0) && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
            <View
              style={[
                PDF_STYLES.regularBold,
                PDF_STYLES.w50,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold
                }
              ]}
            >
              <Text>{subTotalLabel}</Text>
            </View>
            <View
              style={[
                PDF_STYLES.regularBold,
                PDF_STYLES.w50,
                PDF_STYLES.alignEnd,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold
                }
              ]}
            >
              <Text>{formattedSubTotalAmount}</Text>
            </View>
          </View>
        </View>
      )}

      {discountAmount > 0 && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>
                {invoiceForm?.discountType === DiscountType.percentage &&
                  `${discountLabel} (${invoiceForm?.discountPercent}%)`}

                {invoiceForm?.discountType !== DiscountType.percentage && discountLabel}
              </Text>
            </View>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                PDF_STYLES.alignEnd,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>{discountAmountFormatted}</Text>
            </View>
          </View>
        </View>
      )}

      {Math.abs(totalTax) > 0 && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>
                {(invoiceForm?.taxType === InvoiceTaxType.deducted ||
                  invoiceForm?.taxType === InvoiceTaxType.exclusive) &&
                  (invoiceForm.taxName
                    ? `${invoiceForm?.taxName} (${invoiceForm?.taxRate}%)`
                    : `${taxLabel} (${invoiceForm?.taxRate ?? 0}%)`)}
                {invoiceForm?.taxType === InvoiceTaxType.inclusive &&
                  (invoiceForm.taxName
                    ? `${invoiceForm?.taxName} (${incLabel} ${invoiceForm?.taxRate}%)`
                    : `${taxLabel} (${incLabel} ${invoiceForm?.taxRate}%)`)}
                {hasPerItemTaxExclusive && taxExclusivePerItemLabel}
                {hasPerItemTaxInclusive && taxInclusivePerItemLabel}
                {!hasPerItemTaxExclusive &&
                  !hasPerItemTaxInclusive &&
                  !invoiceForm?.taxType &&
                  `${taxLabel} (${invoiceForm?.taxRate ?? 0}%)`}
              </Text>
            </View>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                PDF_STYLES.alignEnd,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>{formattedTotalTaxAmount}</Text>
            </View>
          </View>
        </View>
      )}

      {shippingAmount > 0 && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>{shippingFeeLabel}</Text>
            </View>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                PDF_STYLES.alignEnd,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>{shippingAmountFormatted}</Text>
            </View>
          </View>
        </View>
      )}

      {surchargeAmount > 0 && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>
                {invoiceForm?.surchargeType === DiscountType.percentage &&
                  `${surchargeLabel} (${invoiceForm?.surchargePercent}%)`}

                {invoiceForm?.surchargeType !== DiscountType.percentage && surchargeLabel}
              </Text>
            </View>
            <View
              style={[
                PDF_STYLES.regular,
                PDF_STYLES.w50,
                PDF_STYLES.alignEnd,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular
                }
              ]}
            >
              <Text>{surchargeAmountFormatted}</Text>
            </View>
          </View>
        </View>
      )}

      {(discountAmount > 0 || Math.abs(totalTax) > 0 || shippingAmount > 0 || surchargeAmount > 0) && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pt5, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.border, PDF_STYLES.w100, PDF_STYLES.textEnd]} />
        </View>
      )}

      {(totalAmountPaid > 0 ||
        invoiceForm?.status === InvoiceStatus.paid ||
        invoiceForm?.invoiceType === InvoiceType.quotation) && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
            <View
              style={[
                PDF_STYLES.regularBold,
                PDF_STYLES.w50,
                {
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold
                }
              ]}
            >
              <Text>{totalLabel}</Text>
            </View>
            <View
              style={[
                PDF_STYLES.regularBold,
                PDF_STYLES.w50,
                PDF_STYLES.alignEnd,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
              ]}
            >
              <Text>{totalAmountFormatted}</Text>
            </View>
          </View>
        </View>
      )}

      {totalAmountPaid > 0 &&
        invoiceForm?.invoiceType === InvoiceType.invoice &&
        invoiceForm?.status !== InvoiceStatus.paid && (
          <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
            <View style={PDF_STYLES.flexGrow} />
            <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
              <View
                style={[
                  PDF_STYLES.regular,
                  PDF_STYLES.w50,
                  { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
                ]}
              >
                <Text>{paidLabel}</Text>
              </View>
              <View
                style={[
                  PDF_STYLES.regular,
                  PDF_STYLES.w50,
                  PDF_STYLES.alignEnd,
                  { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regular }
                ]}
              >
                <Text>{totalAmountPaidFormatted}</Text>
              </View>
            </View>
          </View>
        )}

      {invoiceForm?.invoiceType === InvoiceType.invoice && invoiceForm?.status !== InvoiceStatus.paid && (
        <View style={[PDF_STYLES.row, PDF_STYLES.pb5]}>
          <View style={PDF_STYLES.flexGrow} />
          <View style={[PDF_STYLES.row, PDF_STYLES.w100, PDF_STYLES.textEnd]}>
            <View
              style={[
                PDF_STYLES.regularBold,
                PDF_STYLES.w50,
                { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold }
              ]}
            >
              <Text>{balanceDueLabel}</Text>
            </View>
            <View
              style={[
                PDF_STYLES.regularBold,
                PDF_STYLES.w50,
                PDF_STYLES.alignEnd,
                {
                  color: invoiceForm?.invoiceCustomization?.color,
                  fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].regularBold
                }
              ]}
            >
              <Text>{balanceDueFormatted}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
export const FinancialInfo = memo(FinancialInfoComponent);
