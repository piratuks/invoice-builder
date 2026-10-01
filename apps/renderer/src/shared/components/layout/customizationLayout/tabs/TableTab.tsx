import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  ListItemButton,
  ListItemText,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { SortOrder } from '@invoice-builder/contracts';
import { TableHeaderStyle, TableRowStyle } from '@invoice-builder/contracts';

import { useForm } from '../../../../hooks/form/useForm';
import type { CustomizationFormTable } from '../../../../types/invoice';

import { SortableItem } from '../../../lists/sortableItem/SortableItem';
import { TabPanel } from '../../tabPanel/TabPanel';

interface Props {
  value: number;
  onChange?: (data: CustomizationFormTable) => void;
  data?: CustomizationFormTable;
}
export const TableTab: FC<Props> = ({ data, value, onChange }) => {
  const { t } = useTranslation();
  const { form, setForm, update } = useForm<CustomizationFormTable>(data ?? {});
  const lastEmittedRef = useRef<CustomizationFormTable | undefined>(data);

  const sensors = useSensors(useSensor(PointerSensor));

  const sortItemObjectList = useMemo(() => {
    if (form.fieldSortOrders != undefined) {
      const sortOrders = form.fieldSortOrders;
      const defaultCols = Object.entries(sortOrders).map(([key, value]) => ({
        key,
        value
      }));
      const customCols =
        data?.customField?.map(field => ({
          key: field.header,
          value: field.sortOrder
        })) ?? [];
      const allCols = [...defaultCols, ...customCols];
      return allCols.sort((a, b) => a.value - b.value);
    }

    return [];
  }, [form.fieldSortOrders, data]);

  const sortItemObjectLabels = useMemo(() => {
    const defaultLabels: { [K in keyof SortOrder]?: string } = {
      no: t('common.tableRowNo'),
      item: t('common.tableItem'),
      unit: t('common.unit'),
      quantity: t('invoices.quantity'),
      unitCost: t('common.unitCost'),
      total: t('common.total')
    };
    const customLabels: { [key: string]: string } = {};
    if (data && data.customField && data.customField.length > 0) {
      data.customField.forEach(field => {
        customLabels[field.header] = field.header;
      });
    }
    return { ...defaultLabels, ...customLabels };
  }, [t, data]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sortItemObjectList.findIndex(
        (i, idx) => `customizable-sort-order-${i.key}-${idx}` === active.id
      );
      const newIndex = sortItemObjectList.findIndex((i, idx) => `customizable-sort-order-${i.key}-${idx}` === over?.id);
      const newItems = arrayMove(sortItemObjectList, oldIndex, newIndex);

      const newItemsWithUpdatedValues = newItems.map((item, index) => ({
        ...item,
        value: index
      }));

      const updatedFieldSortOrders: SortOrder = newItemsWithUpdatedValues.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as SortOrder);
      setForm({ ...form, fieldSortOrders: updatedFieldSortOrders });
    }
  };

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data, setForm]);

  useEffect(() => {
    if (!form) return;
    let isChanged = false;
    try {
      const prevForm = lastEmittedRef.current;
      isChanged = JSON.stringify(prevForm) !== JSON.stringify(form);
    } catch {
      isChanged = true;
    }
    if (!isChanged) return;

    lastEmittedRef.current = form;
    onChange?.(form);
  }, [form, onChange]);

  return (
    <TabPanel value={value} index={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">{t('common.tableHeaderStyle')}</FormLabel>
            <RadioGroup
              row
              value={form.tableHeaderStyle ?? ''}
              onChange={(_e, newValue) => {
                update('tableHeaderStyle', newValue as TableHeaderStyle);
              }}
            >
              <FormControlLabel value={TableHeaderStyle.dark} control={<Radio />} label={t('common.dark')} />
              <FormControlLabel value={TableHeaderStyle.light} control={<Radio />} label={t('common.light')} />
              <FormControlLabel value={TableHeaderStyle.outline} control={<Radio />} label={t('common.outline')} />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">{t('common.tableRowStyle')}</FormLabel>
            <RadioGroup
              row
              value={form.tableRowStyle ?? ''}
              onChange={(_e, newValue) => {
                update('tableRowStyle', newValue as TableRowStyle);
              }}
            >
              <FormControlLabel value={TableRowStyle.bordered} control={<Radio />} label={t('common.bordered')} />
              <FormControlLabel value={TableRowStyle.classic} control={<Radio />} label={t('common.classic')} />
              <FormControlLabel value={TableRowStyle.stripped} control={<Radio />} label={t('common.stripped')} />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.showQuantity ?? false}
                onChange={(_e, newValue) => {
                  update('showQuantity', newValue);
                }}
              />
            }
            label={t('common.showQuantity')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.showRowNo ?? false}
                onChange={(_e, newValue) => {
                  update('showRowNo', newValue);
                }}
              />
            }
            label={t('common.showRowNo')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.showUnit ?? false}
                onChange={(_e, newValue) => {
                  update('showUnit', newValue);
                }}
              />
            }
            label={t('common.showUnit')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography
            component="legend"
            variant="body1"
            sx={{ fontWeight: 400, color: 'text.secondary', marginBottom: 1 }}
          >
            {t('invoices.sortOrder')}
          </Typography>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={sortItemObjectList.map((i, idx) => `customizable-sort-order-${i.key}-${idx}`) ?? []}
              strategy={verticalListSortingStrategy}
            >
              {sortItemObjectList.map((item, index) => {
                if (item.key === 'no' && !form.showRowNo) return null;
                if (item.key === 'quantity' && !form.showQuantity) return null;
                if (item.key === 'unit' && !form.showUnit) return null;

                return (
                  <SortableItem
                    key={`customizable-sort-order-${item.key}-${index}`}
                    id={`customizable-sort-order-${item.key}-${index}`}
                  >
                    <ListItemButton
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
                            {sortItemObjectLabels[item.key] ?? item.key}
                          </Typography>
                        }
                        disableTypography
                        sx={{ m: 0 }}
                        slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
                      />
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
        </Grid>
      </Grid>
    </TabPanel>
  );
};
