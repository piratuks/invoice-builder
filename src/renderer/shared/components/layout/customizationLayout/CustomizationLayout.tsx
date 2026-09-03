import { Box, Tab, Tabs } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '../../../enums/language';
import { useForm } from '../../../hooks/form/useForm';
import type {
  CustomizationForm,
  CustomizationFormBranding,
  CustomizationFormPageSetup,
  CustomizationFormTable,
  CustomizationFormTypographyLabels
} from '../../../types/invoice';
import { a11yProps } from '../../../utils/generalFunctions';
import { BrandingTab } from './tabs/BrandingTab';
import { PageSetupTab } from './tabs/PageSetupTab';
import { TableTab } from './tabs/TableTab';
import { TypographyLabelsTab } from './tabs/TypographyLabelsTab';

interface Props {
  renderCustomTop?: () => ReactNode;
  renderCustomBottom?: () => ReactNode;
  onChange?: (data: CustomizationForm) => void;
  data?: CustomizationForm;
  language?: Language;
}
export const CustomizationLayout: FC<Props> = ({
  data,
  language,
  onChange,
  renderCustomTop = () => null,
  renderCustomBottom = () => null
}) => {
  const { t } = useTranslation();
  const { form, setForm } = useForm<CustomizationForm>(data ?? {});
  const lastEmittedRef = useRef<CustomizationForm | undefined>(data);
  const [value, setValue] = useState(0);

  const pageSetupData = useMemo(() => {
    return {
      pageFormat: data?.pageFormat,
      layoutId: data?.layoutId,
      layoutSchema: data?.layoutSchema,
      fontSize: data?.fontSize,
      fontFamily: data?.fontFamily
    };
  }, [data]);

  const handleOnChangePageSetup = useCallback(
    (item: CustomizationFormPageSetup) => {
      setForm({
        ...form,
        ...item
      });
    },
    [form, setForm]
  );

  const brandingData = useMemo(() => {
    return {
      color: data?.color,
      logoSize: data?.logoSize,
      watermarkFileName: data?.watermarkFileName,
      watermarkFileType: data?.watermarkFileType,
      watermarkFileSize: data?.watermarkFileSize,
      watermarkFileData: data?.watermarkFileData,
      paidWatermarkFileName: data?.paidWatermarkFileName,
      paidWatermarkFileType: data?.paidWatermarkFileType,
      paidWatermarkFileSize: data?.paidWatermarkFileSize,
      paidWatermarkFileData: data?.paidWatermarkFileData
    };
  }, [data]);

  const handleOnChangeBranding = useCallback(
    (item: CustomizationFormBranding) => {
      setForm({
        ...form,
        ...item
      });
    },
    [form, setForm]
  );

  const tableData = useMemo(() => {
    return {
      tableHeaderStyle: data?.tableHeaderStyle,
      tableRowStyle: data?.tableRowStyle,
      showQuantity: data?.showQuantity,
      showUnit: data?.showUnit,
      showRowNo: data?.showRowNo,
      fieldSortOrders: data?.fieldSortOrders,
      customField: data?.customField
    };
  }, [data]);

  const handleOnChangeTable = useCallback(
    (item: CustomizationFormTable) => {
      setForm({
        ...form,
        ...item
      });
    },
    [form, setForm]
  );

  const typographyLabelsData = useMemo(() => {
    return {
      labelUpperCase: data?.labelUpperCase,
      pdfTexts: data?.pdfTexts
    };
  }, [data]);

  const handleOnChangeTypographyLabels = useCallback(
    (item: CustomizationFormTypographyLabels) => {
      setForm({
        ...form,
        ...item
      });
    },
    [form, setForm]
  );

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
    <>
      <Box sx={{ width: '100%' }}>
        {renderCustomTop()}
        <Tabs value={value} onChange={handleChange} sx={{ marginTop: 1 }}>
          <Tab
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{t('common.pageSetup')}</Box>}
            {...a11yProps(0)}
          />
          <Tab
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{t('common.branding')}</Box>}
            {...a11yProps(1)}
          />
          <Tab
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{t('common.table')}</Box>}
            {...a11yProps(2)}
          />
          <Tab
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{t('common.typographyLabels')}</Box>}
            {...a11yProps(3)}
          />
        </Tabs>
        <PageSetupTab value={value} data={pageSetupData} onChange={handleOnChangePageSetup} />
        <BrandingTab value={value} data={brandingData} onChange={handleOnChangeBranding} />
        <TableTab value={value} data={tableData} onChange={handleOnChangeTable} />
        <TypographyLabelsTab
          language={language}
          value={value}
          data={typographyLabelsData}
          onChange={handleOnChangeTypographyLabels}
        />

        <Box sx={{ marginTop: 1 }}></Box>
        {renderCustomBottom()}
      </Box>
    </>
  );
};
