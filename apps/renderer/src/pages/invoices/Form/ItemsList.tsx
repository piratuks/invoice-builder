import type { InvoiceFromData } from '../../../shared/types/formData';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton, ListItemButton, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import React, { memo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableItem } from '../../../shared/components/lists/sortableItem/SortableItem';
import type { InvoiceItem } from '@invoice-builder/contracts';
import { getItemFinancialData } from '../../../shared/utils/invoiceFunctions';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';

interface Props {
  invoiceForm?: InvoiceFromData;
  setInvoiceForm?: React.Dispatch<React.SetStateAction<InvoiceFromData | undefined>>;
  onDelete?: (item: InvoiceItem) => void;
  onEdit?: (item: InvoiceItem) => void;
}

const ItemsListComponent: FC<Props> = ({ invoiceForm, setInvoiceForm, onEdit = () => {}, onDelete = () => {} }) => {
  const storeSettings = useAppSelector(selectSettings);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: InvoiceItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && invoiceForm?.invoiceItems && setInvoiceForm) {
      const oldIndex = invoiceForm.invoiceItems.findIndex((i, idx) => `invoice-item-${i.itemId}-${idx}` === active.id);
      const newIndex = invoiceForm.invoiceItems.findIndex((i, idx) => `invoice-item-${i.itemId}-${idx}` === over?.id);
      const newItems = arrayMove(invoiceForm.invoiceItems, oldIndex, newIndex);
      setInvoiceForm({ ...invoiceForm, invoiceItems: newItems });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={invoiceForm?.invoiceItems?.map((i, idx) => `invoice-item-${i.itemId}-${idx}`) ?? []}
        strategy={verticalListSortingStrategy}
      >
        {invoiceForm?.invoiceItems?.map((invoiceItem, index) => {
          const { quantity, taxType, taxRate, invoiceItemSnapshot, customField } = invoiceItem;
          const { unitPriceCents = '0', itemName } = invoiceItemSnapshot;

          const { formattedUnitPrice, formattedTotal, formattedTax, formattedItemDiscountAmount, itemDiscountAmount } =
            getItemFinancialData({
              storeSettings,
              currencySymbol: invoiceForm?.invoiceCurrencySnapshot?.currencySymbol,
              currencyCode: invoiceForm?.invoiceCurrencySnapshot?.currencyCode,
              currencySubunit: invoiceForm?.invoiceCurrencySnapshot?.currencySubunit,
              currencyFormat: invoiceForm?.currencyFormat,
              unitPrice: Number(unitPriceCents),
              quantity: Number(quantity),
              taxType,
              taxRate,
              invoiceItems: invoiceForm?.invoiceItems ?? [],
              discountType: invoiceForm?.discountType,
              discountAmount: Number(invoiceForm?.discountAmountCents ?? 0),
              discountPercent: invoiceForm?.discountPercent
            });

          return (
            <SortableItem
              key={`invoice-item-${invoiceItem.itemId}-${index}`}
              id={`invoice-item-${invoiceItem.itemId}-${index}`}
            >
              <ListItemButton
                onClick={() => onEdit(invoiceItem)}
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
                  onClick={e => handleMenuOpen(e, invoiceItem)}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu anchorEl={anchorEl} open={open && selectedItem === invoiceItem} onClose={handleMenuClose}>
                  <MenuItem
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (selectedItem) {
                        onEdit(selectedItem);
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
                        onDelete(selectedItem);
                        handleMenuClose();
                      }
                    }}
                  >
                    {t('ariaLabel.remove')}
                  </MenuItem>
                </Menu>

                <ListItemText
                  primary={
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
                      {itemName}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {formattedUnitPrice} {' X '} {quantity}
                      </Typography>
                      {customField && (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {customField.header}: {customField.value}
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
                    {formattedTotal}
                  </Typography>
                  {invoiceItem.taxType && (
                    <>
                      {itemDiscountAmount > 0 && (
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
                          {t('invoices.itemDiscount', {
                            amount: formattedItemDiscountAmount
                          })}
                        </Typography>
                      )}
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
                        {t('invoices.itemTax', {
                          rate: invoiceItem.taxRate,
                          amount: formattedTax
                        })}
                      </Typography>
                    </>
                  )}
                </Box>
                <Tooltip title={t('ariaLabel.dragToSort')}>
                  <IconButton size="small" data-drag-handle onMouseDown={e => e.stopPropagation()}>
                    <DragIndicatorIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            </SortableItem>
          );
        })}
      </SortableContext>
    </DndContext>
  );
};

export const ItemsList = memo(ItemsListComponent);
