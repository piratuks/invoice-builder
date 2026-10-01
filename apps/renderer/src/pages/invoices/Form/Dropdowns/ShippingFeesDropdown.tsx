import { Box, Grid, SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AmountInput } from '../../../../shared/components/inputs/amountInput/AmountInput';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import { validators } from '../../../../shared/utils/validatorFunctions';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (shippingFee: number) => void;
  currShippingFee?: number;
}
const ShippingFeesDropdownComponent: FC<Props> = ({ isOpen, currShippingFee, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const storeSettings = useAppSelector(selectSettings);

  const [shippingFee, setShippingFee] = useState<number | undefined>(currShippingFee ?? 0);
  const [shippingFeeError, setShippingFeeErrors] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const valid = shippingFee !== undefined;

    setIsFormValid(valid);
  }, [shippingFee]);

  useEffect(() => {
    if (isOpen) setShippingFee(currShippingFee ?? 0);
  }, [currShippingFee, isOpen]);

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
              height: isDesktop ? '20%' : '30%',
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
            title={t('invoices.shippingFee')}
            showBack={false}
            showSave={true}
            showClose={false}
            formData={shippingFee}
            isFormValid={isFormValid}
            onClose={onClose}
            onSave={data => {
              onClick?.(data as number);
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <AmountInput
              required={true}
              amountFormat={storeSettings?.amountFormat}
              label={t('invoices.fixedFee')}
              value={shippingFee}
              error={shippingFeeError}
              helperText={shippingFeeError ? t('common.fieldRequired') : ''}
              onChange={e => {
                setShippingFee(e);
                if (!validators.required((e ?? '').toString())) {
                  setShippingFeeErrors(true);
                } else {
                  setShippingFeeErrors(false);
                }
              }}
            />
          </Grid>
        </Grid>
      </SwipeableDrawer>
    </>
  );
};
export const ShippingFeesDropdown = memo(ShippingFeesDropdownComponent);
