import { StyleSheet } from '@react-pdf/renderer';
import { SizeType } from '../../../shared/enums/sizeType';
import type { ColumnWeights } from '../../../shared/types/columnsWeights';

export const createCustomFontStyles = (fontFamily?: string) =>
  StyleSheet.create({
    customFont: {
      fontFamily: fontFamily || 'Roboto'
    }
  });

export const DEFAULT_FONT_SIZES = SizeType.medium;
export const DEFAULT_LOGO_SIZES = SizeType.medium;
export const DEFAULT_USER_COLUMN_WEIGHT = 10;

export const LOGO_SIZES = {
  small: { width: 48, height: 48 },
  medium: { width: 64, height: 64 },
  large: { width: 80, height: 80 }
};

//COLUMN_WEIGHTS is considered legacy
export const COLUMN_WEIGHTS: ColumnWeights = {
  rowNo: 5,
  item: 35,
  quantity: 15,
  unit: 15,
  unitCost: 15,
  total: 15
};

export const FIXED_COLUMNS = {
  rowNo: 30,
  quantity: 55,
  unit: 55,
  unitCost: 65,
  total: 75
};

export const FONT_WIDTH_MULTIPLIERS: Record<string, number> = {
  Helvetica: 6,
  Roboto: 6,
  'Times-Roman': 7,
  Courier: 10,
  Inter: 6
};

export const FONT_SIZES = {
  small: {
    page: 10,
    business: 12,
    businessText: 8,
    title: 16,
    regular: 8,
    regularBold: 8,
    tableCellHeader: 8,
    tableCell: 7,
    tableCellSubtle: 6,
    pageCounter: 8
  },
  medium: {
    page: 12,
    business: 14,
    businessText: 10,
    title: 20,
    regular: 10,
    regularBold: 10,
    tableCellHeader: 10,
    tableCell: 9,
    tableCellSubtle: 8,
    pageCounter: 10
  },
  large: {
    page: 14,
    business: 16,
    businessText: 12,
    title: 24,
    regular: 12,
    regularBold: 12,
    tableCellHeader: 12,
    tableCell: 11,
    tableCellSubtle: 10,
    pageCounter: 12
  }
};

export const PDF_STYLES = StyleSheet.create({
  page: {
    padding: 32
  },
  header: { paddingBottom: 16 },
  row: { flexDirection: 'row' },
  spaceBetween: { justifyContent: 'space-between' },
  flexGrow: { flexGrow: 1 },
  gap3: { gap: 3 },
  gap4: { gap: 4 },
  gap5: { gap: 5 },
  gap10: { gap: 10 },
  pt20: { paddingTop: 20 },
  pb20: { paddingBottom: 20 },
  pt10: { paddingTop: 10 },
  pb10: { paddingBottom: 10 },
  pb5: { paddingBottom: 5 },
  pt5: { paddingTop: 5 },
  w100: { width: '100%' },
  w40: { width: '40%' },
  textEnd: { textAlign: 'right' },
  w60: { width: '60%' },
  w50: { width: '50%' },
  w5: { width: '5%' },
  w35: { width: '35%' },
  w20: { width: '20%' },
  w15: { width: '15%' },
  border: { height: 1, backgroundColor: '#e0e0e0' },
  maxw50: { maxWidth: '50%' },
  alignStart: { alignItems: 'flex-start' },
  alignCenter: { alignItems: 'center' },
  alignEnd: { alignItems: 'flex-end' },
  business: { fontWeight: 500 },
  businessText: { fontWeight: 400, color: '#808080' },
  title: { fontWeight: 700 },
  regular: { fontWeight: 400 },
  regularBold: { fontWeight: 600, color: '#333333' },
  italic: { fontStyle: 'italic' },
  table: {
    width: '100%',
    paddingTop: 10
  },
  tableCol: {
    padding: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tableCellHeader: {
    fontWeight: 'bold'
  },
  tableCellSubtle: {
    color: '#808080'
  },
  attachment: { width: '100%', height: '90%', objectFit: 'contain' },
  signature: {
    width: '100px',
    objectFit: 'contain'
  },
  watermark: {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    width: '100%',
    opacity: 0.2,
    objectFit: 'contain'
  },
  watermarkPaid: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-30deg)',
    width: 64,
    height: 64,
    opacity: 1
  },
  pageCounter: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    color: '#808080'
  }
});
