import { Box, ListItemButton, ListItemText, Typography, useTheme } from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { toDataUrl } from '../../../shared/utils/dataUrlFunctions';

interface Props {
  data?: {
    businessLogo?: Uint8Array<ArrayBufferLike>;
    businessFileType?: string;
    businessName?: string;
    businessShortName?: string;
  };
  isRequired?: boolean;
  onEdit: () => void;
}

const BusinessSelectorComponent: FC<Props> = ({ data, onEdit, isRequired = true }) => {
  const { businessLogo, businessFileType, businessName, businessShortName } = data ?? {};

  const { t } = useTranslation();
  const theme = useTheme();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const url = businessLogo ? await toDataUrl(businessLogo, businessFileType) : null;
      setLogoUrl(url);
    })();
  }, [businessLogo, businessFileType]);

  return (
    <ListItemButton
      onClick={onEdit}
      sx={{
        pt: 2,
        pb: 2,
        pl: 2,
        pr: 2,
        width: '100%',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'start',
          alignItems: 'center',
          width: '100%',
          gap: 2
        }}
      >
        <ListItemText
          primary={
            <Typography
              component="div"
              variant="body1"
              sx={{ fontWeight: 600, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {t('businesses.title').toUpperCase()} {isRequired ? '*' : ''}
            </Typography>
          }
          secondary={
            <Typography
              component="div"
              variant="body2"
              sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {businessName}
            </Typography>
          }
          disableTypography
          sx={{ m: 0 }}
          slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
        />
        {logoUrl ? (
          <Box
            sx={{
              width: '60px',
              height: '60px',
              border: `2px solid ${theme.palette.primary.main}`,
              background: theme.palette.common.white,
              borderRadius: 1,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={logoUrl}
              alt={t('invoices.businessLogo')}
              style={{ width: '60px', height: '60px', objectFit: 'contain' }}
            />
          </Box>
        ) : businessShortName ? (
          <Box
            sx={{
              width: '60px',
              height: '60px',
              border: `2px solid ${theme.palette.primary.main}`,
              background: theme.palette.common.white,
              color: theme.palette.common.black,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 1,
              fontWeight: 500,
              overflow: 'hidden'
            }}
          >
            {businessShortName}
          </Box>
        ) : null}
      </Box>
    </ListItemButton>
  );
};
export const BusinessSelector = memo(BusinessSelectorComponent);
