import { Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { memo, useMemo, type FC } from 'react';
import { TableHeaderStyle } from '../../../shared/enums/tableHeaderStyle';
import { TableRowStyle } from '../../../shared/enums/tableRowStyle';
import type { CustomField, InvoiceFromData } from '../../../shared/types/invoice';
import type { Settings } from '../../../shared/types/settings';
import { getItemFinancialData } from '../../../shared/utils/invoiceFunctions';
import { DEFAULT_TABLE_FIELD_SORT_ORDERS } from '../../../state/constant';
import { DEFAULT_FONT_SIZES, FIXED_COLUMNS, FONT_SIZES, FONT_WIDTH_MULTIPLIERS, PDF_STYLES } from './constant';

interface PropsLabels {
  itemLabel: string;
  unitLabel: string;
  qtyLabel: string;
  unitCostLabel: string;
  totalLabel: string;
  taxLabel: string;
  discountLabel: string;
}
interface Props {
  invoiceForm?: InvoiceFromData;
  storeSettings?: Settings;
  labels: PropsLabels;
}
const ItemsInfoComponent: FC<Props> = ({ invoiceForm, storeSettings, labels }) => {
  const { itemLabel, unitLabel, qtyLabel, unitCostLabel, totalLabel, taxLabel, discountLabel } = labels;

  const customFields = useMemo(() => {
    const fields =
      invoiceForm?.invoiceItems
        ?.map(item => item.customField)
        .filter((item): item is CustomField => typeof item?.header === 'string') ?? [];

    const map = new Map<string, CustomField>();

    fields.forEach(field => {
      map.set(field.header, field);
    });

    return [...map.values()];
  }, [invoiceForm?.invoiceItems]);

  const sizes = useMemo(() => {
    const weights: Record<string, Style> = {};

    if (invoiceForm?.invoiceCustomization?.showRowNo) {
      weights.rowNo = { width: FIXED_COLUMNS.rowNo };
    }
    if (invoiceForm?.invoiceCustomization?.showQuantity) {
      weights.quantity = { width: FIXED_COLUMNS.quantity };
    }
    if (invoiceForm?.invoiceCustomization?.showUnit) {
      weights.unit = { width: FIXED_COLUMNS.unit };
    }

    weights.unitCost = { width: FIXED_COLUMNS.unitCost };
    weights.total = { width: FIXED_COLUMNS.total };

    customFields.forEach(col => {
      const multiplier = invoiceForm?.invoiceCustomization?.fontFamily
        ? FONT_WIDTH_MULTIPLIERS[invoiceForm.invoiceCustomization.fontFamily]
        : 6;
      weights[col.header] = {
        minWidth: Math.max(70, col.header.length * multiplier),
        flexGrow: 1,
        flexBasis: 0
      };
    });

    weights.item = {
      flexGrow: 3,
      flexBasis: 0,
      minWidth: 100
    };

    return weights;
  }, [customFields, invoiceForm]);

  const lightenHex = (data: { hex?: string; amount: number }) => {
    const { hex, amount } = data;

    if (!hex) return 'inherit';

    const clean = hex.replace('#', '');

    const num = parseInt(clean, 16);

    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;

    const lighten = (c: number) => Math.round(c + (255 - c) * amount);

    const newR = lighten(r);
    const newG = lighten(g);
    const newB = lighten(b);

    return '#' + [newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('');
  };

  const headerRowStyle = useMemo(() => {
    let rowBckgColor = 'transparent';
    let rowFontColor = 'inherit';
    let rowBorder: string | undefined = '1px solid #e0e0e0';
    let rowBorderCell: string | undefined = undefined;

    if (invoiceForm?.invoiceCustomization?.tableHeaderStyle === TableHeaderStyle.light) {
      rowBckgColor = lightenHex({ hex: invoiceForm?.invoiceCustomization?.color, amount: 0.9 });
      rowBorder = undefined;
    } else if (invoiceForm?.invoiceCustomization?.tableHeaderStyle === TableHeaderStyle.dark) {
      rowFontColor = '#ffffff';
      rowBckgColor = invoiceForm?.invoiceCustomization?.color ?? 'inherit';
      rowBorder = undefined;
    }

    if (
      invoiceForm?.invoiceCustomization?.tableRowStyle === TableRowStyle.bordered &&
      invoiceForm?.invoiceCustomization?.tableHeaderStyle === TableHeaderStyle.outline
    ) {
      rowBorder = undefined;
      rowBorderCell = '1px solid #e0e0e0';
    }

    return { bckgColor: rowBckgColor, fontColor: rowFontColor, border: rowBorder, borderCell: rowBorderCell };
  }, [invoiceForm]);

  const sortedColumns = useMemo(() => {
    const sortOrders = invoiceForm?.invoiceCustomization?.fieldSortOrders ?? DEFAULT_TABLE_FIELD_SORT_ORDERS;
    const defaultCols = Object.entries(sortOrders).map(([key, value]) => ({
      key,
      sortOrder: value
    }));
    const customCols = customFields.map(f => ({
      key: f.header,
      sortOrder: f.sortOrder
    }));
    const allCols = [...defaultCols, ...customCols];
    allCols.sort((a, b) => a.sortOrder - b.sortOrder);
    return allCols.map(c => c.key);
  }, [invoiceForm?.invoiceCustomization?.fieldSortOrders, customFields]);

  const visibleColumns = useMemo(() => {
    return sortedColumns.filter(colKey => {
      switch (colKey) {
        case 'no':
          return invoiceForm?.invoiceCustomization?.showRowNo;
        case 'unit':
          return invoiceForm?.invoiceCustomization?.showUnit;
        case 'quantity':
          return invoiceForm?.invoiceCustomization?.showQuantity;
        default:
          return true;
      }
    });
  }, [
    sortedColumns,
    invoiceForm?.invoiceCustomization?.showRowNo,
    invoiceForm?.invoiceCustomization?.showUnit,
    invoiceForm?.invoiceCustomization?.showQuantity
  ]);

  const rowStyle = useMemo(() => {
    let rowBorderBottom: string | undefined = '1px solid #e0e0e0';
    let rowBorderCell: string | undefined = undefined;
    let rowColor = undefined;

    if (invoiceForm?.invoiceCustomization?.tableRowStyle === TableRowStyle.bordered) {
      rowBorderCell = '1px solid #e0e0e0';
    } else if (invoiceForm?.invoiceCustomization?.tableRowStyle === TableRowStyle.stripped) {
      rowBorderBottom = undefined;
      rowColor = '#e0e0e0';
    }

    return {
      borderBottom: rowBorderBottom,
      borderCell: rowBorderCell,
      backgroundColor: rowColor
    };
  }, [invoiceForm]);

  return (
    <>
      <View
        style={[
          PDF_STYLES.row,
          {
            backgroundColor: headerRowStyle.bckgColor,
            color: headerRowStyle.fontColor,
            border: headerRowStyle.border,
            borderBottom: rowStyle.borderCell,
            borderTop: rowStyle.borderCell
          }
        ]}
      >
        {visibleColumns.map((colKey, index) => {
          console.log(sizes);
          switch (colKey) {
            case 'no':
              return (
                <View
                  key={colKey}
                  style={[
                    PDF_STYLES.tableCol,
                    sizes['rowNo'],
                    {
                      borderLeft: rowStyle.borderCell,
                      ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                    }
                  ]}
                >
                  <Text
                    style={[
                      PDF_STYLES.tableCellHeader,
                      {
                        fontSize:
                          FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCellHeader
                      }
                    ]}
                  >
                    #
                  </Text>
                </View>
              );
            case 'item':
              return (
                <View
                  key={colKey}
                  style={[
                    PDF_STYLES.tableCol,
                    sizes['item'],
                    {
                      borderLeft: rowStyle.borderCell,
                      ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                    }
                  ]}
                >
                  <Text
                    style={[
                      PDF_STYLES.tableCellHeader,
                      {
                        fontSize:
                          FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCellHeader
                      }
                    ]}
                  >
                    {itemLabel}
                  </Text>
                </View>
              );
            case 'unit':
              return (
                <View
                  key={colKey}
                  style={[
                    PDF_STYLES.tableCol,
                    sizes['unit'],
                    PDF_STYLES.textEnd,
                    {
                      borderLeft: rowStyle.borderCell,
                      ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                    }
                  ]}
                >
                  <Text
                    style={[
                      PDF_STYLES.tableCellHeader,
                      {
                        fontSize:
                          FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCellHeader
                      }
                    ]}
                  >
                    {unitLabel}
                  </Text>
                </View>
              );
            case 'quantity':
              return (
                <View
                  key={colKey}
                  style={[
                    PDF_STYLES.tableCol,
                    sizes['quantity'],
                    PDF_STYLES.textEnd,
                    {
                      borderLeft: rowStyle.borderCell,
                      ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                    }
                  ]}
                >
                  <Text
                    style={[
                      PDF_STYLES.tableCellHeader,
                      {
                        fontSize:
                          FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCellHeader
                      }
                    ]}
                  >
                    {qtyLabel}
                  </Text>
                </View>
              );
            case 'unitCost':
              return (
                <View
                  key={colKey}
                  style={[
                    PDF_STYLES.tableCol,
                    sizes['unitCost'],
                    PDF_STYLES.textEnd,
                    {
                      borderLeft: rowStyle.borderCell,
                      ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                    }
                  ]}
                >
                  <Text
                    style={[
                      PDF_STYLES.tableCellHeader,
                      {
                        fontSize:
                          FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCellHeader
                      }
                    ]}
                  >
                    {unitCostLabel}
                  </Text>
                </View>
              );
            case 'total':
              return (
                <View
                  key={colKey}
                  style={[
                    PDF_STYLES.tableCol,
                    sizes['total'],
                    PDF_STYLES.textEnd,
                    {
                      borderLeft: rowStyle.borderCell,
                      ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                    }
                  ]}
                >
                  <Text
                    style={[
                      PDF_STYLES.tableCellHeader,
                      {
                        fontSize:
                          FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCellHeader
                      }
                    ]}
                  >
                    {totalLabel}
                  </Text>
                </View>
              );
            default:
              const field = customFields.find(f => f.header === colKey);
              if (!field) return null;
              return (
                <View
                  key={field.header}
                  style={[
                    PDF_STYLES.tableCol,
                    sizes[field.header],
                    { textAlign: field.alignment },
                    {
                      borderLeft: rowStyle.borderCell,
                      ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                    }
                  ]}
                >
                  <Text
                    style={[
                      PDF_STYLES.tableCellHeader,
                      {
                        fontSize:
                          FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCellHeader
                      }
                    ]}
                  >
                    {field.header}
                  </Text>
                </View>
              );
          }
        })}
      </View>
      {invoiceForm?.invoiceItems?.map((item, index) => {
        const { quantity, taxType, taxRate, invoiceItemSnapshot, customField } = item;
        const { unitPriceCents = '0', itemName, unitName } = invoiceItemSnapshot;

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
          <View
            key={`invoice-item-prev-${item.itemId}-${index}`}
            style={[
              PDF_STYLES.row,
              {
                borderBottom: rowStyle.borderBottom,
                backgroundColor: index % 2 === 1 ? rowStyle.backgroundColor : undefined
              }
            ]}
          >
            {visibleColumns.map((colKey, index) => {
              switch (colKey) {
                case 'no':
                  return (
                    <View
                      key={colKey}
                      style={[
                        PDF_STYLES.tableCol,
                        sizes['rowNo'],
                        {
                          borderLeft: rowStyle.borderCell,
                          ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                        }
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize:
                              FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCell
                          }
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  );
                case 'item':
                  return (
                    <View
                      key={colKey}
                      style={[
                        PDF_STYLES.tableCol,
                        sizes['item'],
                        {
                          borderLeft: rowStyle.borderCell,
                          ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                        }
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize:
                              FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCell
                          }
                        ]}
                      >
                        {itemName}
                      </Text>
                      {taxType && (
                        <>
                          {itemDiscountAmount > 0 && (
                            <Text
                              style={[
                                PDF_STYLES.tableCellSubtle,
                                {
                                  fontSize:
                                    FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES]
                                      .tableCellSubtle
                                }
                              ]}
                            >
                              {`${discountLabel}: ${formattedItemDiscountAmount}`}
                            </Text>
                          )}
                          <Text
                            style={[
                              PDF_STYLES.tableCellSubtle,
                              {
                                fontSize:
                                  FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES]
                                    .tableCellSubtle
                              }
                            ]}
                          >
                            {`${taxLabel}(${taxRate}%): ${formattedTax}`}
                          </Text>
                        </>
                      )}
                    </View>
                  );
                case 'unit':
                  return (
                    <View
                      key={colKey}
                      style={[
                        PDF_STYLES.tableCol,
                        sizes['unit'],
                        PDF_STYLES.textEnd,
                        {
                          borderLeft: rowStyle.borderCell,
                          ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                        }
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize:
                              FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCell
                          }
                        ]}
                      >
                        {unitName}
                      </Text>
                    </View>
                  );
                case 'quantity':
                  return (
                    <View
                      key={colKey}
                      style={[
                        PDF_STYLES.tableCol,
                        sizes['quantity'],
                        PDF_STYLES.textEnd,
                        {
                          borderLeft: rowStyle.borderCell,
                          ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                        }
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize:
                              FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCell
                          }
                        ]}
                      >
                        {quantity}
                      </Text>
                    </View>
                  );
                case 'unitCost':
                  return (
                    <View
                      key={colKey}
                      style={[
                        PDF_STYLES.tableCol,
                        sizes['unitCost'],
                        PDF_STYLES.textEnd,
                        {
                          borderLeft: rowStyle.borderCell,
                          ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                        }
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize:
                              FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCell
                          }
                        ]}
                      >
                        {formattedUnitPrice}
                      </Text>
                    </View>
                  );
                case 'total':
                  return (
                    <View
                      key={colKey}
                      style={[
                        PDF_STYLES.tableCol,
                        sizes['total'],
                        PDF_STYLES.textEnd,
                        {
                          borderLeft: rowStyle.borderCell,
                          ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                        }
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize:
                              FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCell
                          }
                        ]}
                      >
                        {formattedTotal}
                      </Text>
                    </View>
                  );
                default:
                  const field = customFields.find(f => f.header === colKey);
                  if (!field) return null;
                  return (
                    <View
                      key={field.header}
                      style={[
                        PDF_STYLES.tableCol,
                        sizes[field.header],
                        { textAlign: field.alignment },
                        {
                          borderLeft: rowStyle.borderCell,
                          ...(visibleColumns.length - 1 === index && { borderRight: rowStyle.borderCell })
                        }
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize:
                              FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].tableCell
                          }
                        ]}
                      >
                        {customField?.header === field.header && customField.value ? customField.value : ' '}
                      </Text>
                    </View>
                  );
              }
            })}
          </View>
        );
      })}
    </>
  );
};
export const ItemsInfo = memo(ItemsInfoComponent);
