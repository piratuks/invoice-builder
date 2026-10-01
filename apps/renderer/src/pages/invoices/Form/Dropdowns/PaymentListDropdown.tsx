import type { InvoiceFromData } from '../../../../shared/types/formData';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Fab,
  IconButton,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  SwipeableDrawer,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { memo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import type { InvoicePayment } from '@invoice-builder/contracts';
import { formatDate } from '../../../../shared/utils/formatFunctions';
import { getPaidData } from '../../../../shared/utils/invoiceFunctions';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (data: InvoicePayment) => void;
  onRemove?: (data: InvoicePayment) => void;
  onAdd?: () => void;
  data?: InvoicePayment[];
  invoiceForm?: InvoiceFromData;
}
const PaymentListDropdownComponent: FC<Props> = ({
  isOpen,
  invoiceForm,
  data,
  onAdd,
  onClose,
  onRemove,
  onOpen,
  onClick
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const storeSettings = useAppSelector(selectSettings);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<InvoicePayment | null>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: InvoicePayment) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  return (
    <>
      <SwipeableDrawer
        anchor="bottom"
        open={isOpen}
        onClose={() => onClose?.()}
        onOpen={() => onOpen?.()}
        slotProps={{
          paper: {
            sx: {
              maxWidth: isDesktop ? '40%' : '100%',
              height: '50%',
              mx: 'auto',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              p: 3
            }
          }
        }}
      >
        <Box sx={{ mb: 2 }}>
          <PageHeader
            title={t('invoices.payments')}
            showBack={false}
            showSave={false}
            showClose={true}
            onClose={onClose}
          />
        </Box>
        <Box sx={{ position: 'relative', height: '100%' }}>
          {data?.map(paymentItem => {
            const { paidAt, paymentMethod, notes } = paymentItem;

            const { amountPaidFormatted } = getPaidData({
              storeSettings,
              currencyCode: invoiceForm?.invoiceCurrencySnapshot?.currencyCode,
              currencySymbol: invoiceForm?.invoiceCurrencySnapshot?.currencySymbol,
              currencySubunit: invoiceForm?.invoiceCurrencySnapshot?.currencySubunit,
              currencyFormat: invoiceForm?.currencyFormat,
              invoicePayment: paymentItem
            });

            return (
              <ListItemButton
                key={paymentItem.id}
                onClick={() => onClick?.(paymentItem)}
                sx={{
                  pt: 2,
                  pb: 2,
                  pl: 2,
                  pr: 2,
                  width: '100%',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row'
                }}
              >
                <IconButton
                  size="small"
                  onClick={e => handleMenuOpen(e, paymentItem)}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu anchorEl={anchorEl} open={open && selectedItem === paymentItem} onClose={handleMenuClose}>
                  <MenuItem
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (selectedItem) {
                        onClick?.(paymentItem);
                        handleMenuClose();
                      }
                    }}
                  >
                    {t('ariaLabel.edit')}
                  </MenuItem>
                  <MenuItem
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (selectedItem) {
                        onRemove?.(selectedItem);
                        handleMenuClose();
                      }
                    }}
                  >
                    {t('ariaLabel.remove')}
                  </MenuItem>
                </Menu>

                <ListItemText
                  primary={
                    <>
                      {storeSettings && (
                        <Typography
                          component="div"
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            justifyContent: 'start',
                            flexDirection: 'row'
                          }}
                        >
                          {formatDate(paidAt, storeSettings.dateFormat)}
                        </Typography>
                      )}
                    </>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {paymentMethod}
                      </Typography>
                      {notes && (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {notes}
                        </Typography>
                      )}
                    </>
                  }
                  disableTypography
                  sx={{ m: 0 }}
                  slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'end' }}>
                  <Typography
                    component="div"
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      justifyContent: 'start',
                      flexDirection: 'row'
                    }}
                  >
                    {amountPaidFormatted}
                  </Typography>
                </Box>
              </ListItemButton>
            );
          })}
          <Tooltip title={t('ariaLabel.add')}>
            <Fab
              color="primary"
              aria-label={t('ariaLabel.add')}
              onClick={onAdd}
              sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                zIndex: 1000
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      </SwipeableDrawer>
    </>
  );
};
export const PaymentListDropdown = memo(PaymentListDropdownComponent);
