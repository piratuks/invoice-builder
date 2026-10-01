import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  FormControlLabel,
  Grid,
  Switch,
  Typography,
  useTheme
} from '@mui/material';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language, PDFText } from '@invoice-builder/contracts';

import { useForm } from '../../../../hooks/form/useForm';
import { usePdfTexts } from '../../../../hooks/pdf/usePdfTexts';
import type { CustomizationFormTypographyLabels } from '../../../../types/invoice';

import { TabPanel } from '../../tabPanel/TabPanel';
import { LabelModal } from '../modals/LabelModal';

interface Props {
  value: number;
  language?: Language;
  onChange?: (data: CustomizationFormTypographyLabels) => void;
  data?: CustomizationFormTypographyLabels;
}
export const TypographyLabelsTab: FC<Props> = ({ data, value, onChange, language }) => {
  const { t } = useTranslation();
  const { form, setForm, update } = useForm<CustomizationFormTypographyLabels>(data ?? {});
  const lastEmittedRef = useRef<CustomizationFormTypographyLabels | undefined>(data);
  const pdfTexts = usePdfTexts({ labelUpperCase: data?.labelUpperCase, language: language });
  const theme = useTheme();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currLabelMeta, setCurrLabelMeta] = useState<{ key: keyof PDFText; label: string; value?: string } | undefined>(
    undefined
  );

  const handleSave = useCallback(
    (label?: string) => {
      setForm(prev => {
        const key = currLabelMeta!.key;
        const currentPdfTexts = prev.pdfTexts ?? {};

        if (label === undefined) {
          const { [key]: customKey, ...rest } = currentPdfTexts;
          void customKey;

          return {
            ...prev,
            pdfTexts: Object.keys(rest).length > 0 ? rest : undefined
          };
        }

        return {
          ...prev,
          pdfTexts: {
            ...currentPdfTexts,
            [key]: label
          }
        };
      });
      setIsModalOpen(false);
    },
    [setForm, currLabelMeta]
  );

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
      <TabPanel value={value} index={3}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.labelUpperCase ?? false}
                  onChange={(_e, newValue) => {
                    update('labelUpperCase', newValue);
                  }}
                />
              }
              label={t('common.labelsUpperCase')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
              {(Object.keys(pdfTexts) as Array<keyof PDFText>).map(key => {
                const label = pdfTexts[key];
                const value = form?.pdfTexts?.[key];

                return (
                  <Card
                    key={key}
                    onClick={() => {
                      setCurrLabelMeta({ label: label, key: key, value: value });
                      setIsModalOpen(true);
                    }}
                    variant="outlined"
                    sx={{
                      position: 'relative'
                    }}
                  >
                    <CardActionArea>
                      <CardContent>
                        <Typography
                          component="div"
                          variant="body2"
                          sx={{ fontSize: 'small', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {label}
                        </Typography>
                        {value && (
                          <Typography
                            color={theme.palette.text.secondary}
                            component="div"
                            variant="body2"
                            sx={{
                              fontSize: 'medium',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {value}
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );
              })}
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
      <LabelModal
        isOpen={isModalOpen}
        currLabelMeta={currLabelMeta}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};
