import { Box, Card, CardActionArea, CardContent, Chip, darken, lighten, Typography, useTheme } from '@mui/material';
import { memo, useCallback, useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { CurrencyFormat } from '../../shared/enums/currencyFormat';
import { InvoiceStatus } from '../../shared/enums/invoiceStatus';
import { InvoiceType } from '../../shared/enums/invoiceType';
import { Themes } from '../../shared/enums/themes';
import type { Invoice } from '../../shared/types/invoice';
import { formatDate, getFormattedCurrency } from '../../shared/utils/formatFunctions';
import { getBalanceDue, getDaysLeft, getInvoiceTotal } from '../../shared/utils/invoiceFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';

interface Props {
  item: Invoice;
  isSelected?: boolean;
  onEdit: (item: Invoice) => void;
}
const InvoiceListItemComponent: FC<Props> = ({ item, isSelected, onEdit }) => {
  const settings = useAppSelector(selectSettings);
  const theme = useTheme();
  const { t } = useTranslation();

  const getLastPaymentDate = useCallback((): string | null => {
    if (!item.invoicePayments || item.invoicePayments.length === 0) {
      return null;
    }

    return item.invoicePayments.reduce((latest, payment) => {
      const latestTime = new Date(latest).getTime();
      const paymentTime = new Date(payment.paidAt).getTime();
      return paymentTime > latestTime ? payment.paidAt : latest;
    }, item.invoicePayments[0].paidAt);
  }, [item.invoicePayments]);

  const getColor = useCallback(() => {
    if (item.status === InvoiceStatus.partiallyPaid) return theme.palette.warning.main;
    if (item.status === InvoiceStatus.paid) return theme.palette.success.main;
    if (item.status === InvoiceStatus.unpaid) return theme.palette.error.main;
    if (item.status === InvoiceStatus.open) return theme.palette.primary.main;
    if (item.status === InvoiceStatus.closed) return theme.palette.grey[700];

    return theme.palette.divider;
  }, [item, theme]);

  const latestPaidAt = useMemo(() => getLastPaymentDate(), [getLastPaymentDate]);
  const overdueDaysLeft = useMemo(() => getDaysLeft(item.dueDate), [item]);
  const totalAmountCents = useMemo(
    () =>
      getInvoiceTotal({
        taxRate: item.taxRate,
        taxType: item.taxType,
        invoiceItems: item.invoiceItems,
        discountType: item.discountType,
        discountAmount: Number(item.discountAmountCents),
        discountPercent: item.discountPercent,
        shippingFee: Number(item.shippingFeeCents)
      }),
    [item]
  );
  const remainingCents = useMemo(
    () =>
      getBalanceDue({
        taxRate: item.taxRate,
        taxType: item.taxType,
        invoiceItems: item.invoiceItems,
        discountType: item.discountType,
        discountAmount: Number(item.discountAmountCents),
        discountPercent: item.discountPercent,
        shippingFee: Number(item.shippingFeeCents),
        invoicePayments: item.invoicePayments
      }),
    [item]
  );
  const remainingAmount = useMemo(
    () =>
      item.invoiceCurrencySnapshot?.currencySubunit === 0
        ? 0
        : remainingCents / (item.invoiceCurrencySnapshot?.currencySubunit ?? 0),
    [remainingCents, item]
  );
  const totalAmount = useMemo(
    () =>
      item.invoiceCurrencySnapshot?.currencySubunit === 0
        ? 0
        : totalAmountCents / (item.invoiceCurrencySnapshot?.currencySubunit ?? 0),
    [totalAmountCents, item]
  );

  return (
    <>
      <Card
        onClick={() => {
          onEdit(item);
        }}
        variant="outlined"
        sx={{
          position: 'relative',
          borderLeft: '3px solid',
          boxShadow: 1,
          borderLeftColor: getColor(),
          bgcolor: isSelected
            ? theme.palette.mode === Themes.dark
              ? darken(theme.palette.primary.main, 0.9)
              : lighten(theme.palette.primary.main, 0.9)
            : theme.palette.background.paper,
          transition: '0.25s',
          overflow: 'unset'
        }}
      >
        <CardActionArea>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 1,
                  justifyContent: 'space-between'
                }}
              >
                <Chip
                  label={t(item.invoiceType === InvoiceType.invoice ? 'common.invoice' : 'common.quote').toUpperCase()}
                  variant="outlined"
                  size="small"
                  clickable={false}
                  sx={{
                    borderRadius: '5px',
                    pointerEvents: 'none',
                    color: item.isArchived
                      ? theme.palette.mode === Themes.dark
                        ? theme.palette.common.white
                        : theme.palette.common.black
                      : theme.palette.mode === Themes.dark
                        ? theme.palette.common.black
                        : theme.palette.common.white,
                    bgcolor: item.isArchived
                      ? theme.palette.mode === Themes.dark
                        ? theme.palette.grey[700]
                        : theme.palette.grey[200]
                      : getColor(),
                    '.MuiChip-icon': {
                      marginLeft: '4px'
                    }
                  }}
                />

                <Typography
                  color={theme.palette.primary.main}
                  component="div"
                  variant="body1"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {item.invoiceFullNumber}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 1,
                  justifyContent: 'space-between'
                }}
              >
                <Typography
                  color={theme.palette.text.secondary}
                  component="div"
                  variant="body1"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {settings && formatDate(item.issuedAt, settings.dateFormat)}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getColor(),
                      flexShrink: 0
                    }}
                  />
                  <Typography
                    color={theme.palette.text.secondary}
                    component="div"
                    variant="body1"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {item.status?.toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 1,
                  justifyContent: 'space-between'
                }}
              >
                <Typography
                  component="div"
                  variant="body1"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {item.invoiceClientSnapshot?.clientName}
                </Typography>

                {settings && item.invoiceCurrencySnapshot && (
                  <Typography
                    component="div"
                    variant="body1"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {getFormattedCurrency({
                      amount: totalAmount,
                      amountFormat: settings.amountFormat,
                      format: item.currencyFormat as CurrencyFormat,
                      symbol: item.invoiceCurrencySnapshot?.currencySymbol,
                      code: item.invoiceCurrencySnapshot?.currencyCode
                    })}
                  </Typography>
                )}
              </Box>

              {item.dueDate &&
                settings &&
                InvoiceStatus.paid !== item.status &&
                InvoiceStatus.closed !== item.status && (
                  <>
                    {overdueDaysLeft > 0 && (
                      <Typography
                        color={theme.palette.warning.main}
                        component="div"
                        variant="body2"
                        fontSize={'small'}
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {t('invoices.dueDate', {
                          days: overdueDaysLeft,
                          date: formatDate(item.dueDate, settings.dateFormat)
                        })}
                      </Typography>
                    )}
                    {overdueDaysLeft < 0 && (
                      <Typography
                        color={theme.palette.error.main}
                        component="div"
                        variant="body2"
                        fontSize={'small'}
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {t('invoices.overdue', {
                          days: Math.abs(overdueDaysLeft)
                        })}
                      </Typography>
                    )}
                    {overdueDaysLeft === 0 && (
                      <Typography
                        color={theme.palette.warning.main}
                        component="div"
                        variant="body2"
                        fontSize={'small'}
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {t('invoices.dueToday', {
                          date: formatDate(item.dueDate, settings.dateFormat)
                        })}
                      </Typography>
                    )}
                  </>
                )}
              {item.status === InvoiceStatus.paid && latestPaidAt && settings && (
                <>
                  <Typography
                    color={theme.palette.success.main}
                    component="div"
                    variant="body2"
                    fontSize={'small'}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {t('invoices.markedAsPaid', {
                      date: formatDate(latestPaidAt, settings.dateFormat)
                    })}
                  </Typography>
                  {remainingAmount < 0 && item.invoiceCurrencySnapshot && (
                    <Typography
                      color={theme.palette.info.main}
                      component="div"
                      variant="body2"
                      fontSize={'small'}
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {t('invoices.overpaid', {
                        amount: getFormattedCurrency({
                          amount: Math.abs(remainingAmount),
                          amountFormat: settings.amountFormat,
                          format: item.currencyFormat as CurrencyFormat,
                          symbol: item.invoiceCurrencySnapshot.currencySymbol,
                          code: item.invoiceCurrencySnapshot.currencyCode
                        })
                      })}
                    </Typography>
                  )}
                </>
              )}
              {item.status === InvoiceStatus.partiallyPaid &&
                latestPaidAt &&
                settings &&
                item.invoiceCurrencySnapshot && (
                  <Typography
                    color={theme.palette.info.main}
                    component="div"
                    variant="body2"
                    fontSize={'small'}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {t('invoices.partiallyPaid', {
                      amount: getFormattedCurrency({
                        amount: remainingAmount,
                        amountFormat: settings.amountFormat,
                        format: item.currencyFormat as CurrencyFormat,
                        symbol: item.invoiceCurrencySnapshot.currencySymbol,
                        code: item.invoiceCurrencySnapshot.currencyCode
                      })
                    })}
                  </Typography>
                )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </>
  );
};

export const List = memo(InvoiceListItemComponent);
