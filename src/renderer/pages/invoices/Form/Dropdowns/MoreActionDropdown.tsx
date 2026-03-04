import AddCircleIcon from '@mui/icons-material/AddCircle';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { memo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';
import { InvoiceType } from '../../../../shared/enums/invoiceType';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onExportPDF?: () => void;
  onExportPDFUBL?: () => void;
  onExportUBLXML?: () => void;
  onExportXRechnungXML?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMakeInvoice?: () => void;
  showDelete?: boolean;
  showDuplicate?: boolean;
  showMakeInvoice?: boolean;
  isPDFReady?: boolean;
  type: InvoiceType;
}
const MoreActionDropdownComponent: FC<Props> = ({
  isOpen,
  showDelete = true,
  showDuplicate = true,
  showMakeInvoice = true,
  isPDFReady = false,
  type,
  onClose,
  onOpen,
  onExportPDF,
  onExportPDFUBL,
  onExportUBLXML,
  onExportXRechnungXML,
  onDelete,
  onDuplicate,
  onMakeInvoice
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const storeSettings = useAppSelector(selectSettings);

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
              height: '40%',
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
        <Box sx={{ mb: 2, mt: 2, display: 'flex', gap: 2, flexDirection: 'column' }}>
          <PageHeader
            title={t('ariaLabel.moreActions')}
            showBack={false}
            showSave={false}
            showClose={true}
            onClose={onClose}
          />
          <Box>
            {showMakeInvoice && (
              <ListItemButton
                onClick={onMakeInvoice}
                sx={{
                  width: '100%',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'start',
                  flexDirection: 'column'
                }}
              >
                <ListItem sx={{ p: 0 }}>
                  <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                    <AddCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        component="div"
                        variant="body1"
                        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {t('common.makeInvoice')}
                      </Typography>
                    }
                    disableTypography
                    sx={{ m: 0 }}
                    slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                  />
                </ListItem>
              </ListItemButton>
            )}
            <ListItemButton
              onClick={onExportPDF}
              sx={{
                width: '100%',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'start',
                flexDirection: 'column'
              }}
            >
              <ListItem sx={{ p: 0 }}>
                <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                  <PictureAsPdfIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      component="div"
                      variant="body1"
                      sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {t('common.exportPDF')}
                    </Typography>
                  }
                  disableTypography
                  sx={{ m: 0 }}
                  slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                />
              </ListItem>
            </ListItemButton>
            {storeSettings?.ublON && type === InvoiceType.invoice && (
              <>
                <Tooltip title={t('common.tooltipPDFXML')}>
                  <Box>
                    <ListItemButton
                      onClick={onExportPDFUBL}
                      disabled={!isPDFReady}
                      sx={{
                        width: '100%',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'start',
                        alignItems: 'start',
                        flexDirection: 'column'
                      }}
                    >
                      <ListItem sx={{ p: 0 }}>
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                          <PictureAsPdfIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              component="div"
                              variant="body1"
                              sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {t('common.exportPDFEmbeddedUBL')}
                            </Typography>
                          }
                          disableTypography
                          sx={{ m: 0 }}
                          slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                        />
                      </ListItem>
                    </ListItemButton>
                  </Box>
                </Tooltip>
                <Tooltip title={t('common.tooltipXML')}>
                  <Box>
                    <ListItemButton
                      onClick={onExportUBLXML}
                      disabled={!isPDFReady}
                      sx={{
                        width: '100%',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'start',
                        alignItems: 'start',
                        flexDirection: 'column'
                      }}
                    >
                      <ListItem sx={{ p: 0 }}>
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                          <CodeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              component="div"
                              variant="body1"
                              sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {t('common.exportUBLXML')}
                            </Typography>
                          }
                          disableTypography
                          sx={{ m: 0 }}
                          slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                        />
                      </ListItem>
                    </ListItemButton>
                  </Box>
                </Tooltip>
              </>
            )}
            {storeSettings?.xrechnungON && type === InvoiceType.invoice && (
              <>
                <Tooltip title={t('common.tooltipXML')}>
                  <Box>
                    <ListItemButton
                      onClick={onExportXRechnungXML}
                      disabled={!isPDFReady}
                      sx={{
                        width: '100%',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'start',
                        alignItems: 'start',
                        flexDirection: 'column'
                      }}
                    >
                      <ListItem sx={{ p: 0 }}>
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                          <CodeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              component="div"
                              variant="body1"
                              sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {t('common.exportXRechnungXML')}
                            </Typography>
                          }
                          disableTypography
                          sx={{ m: 0 }}
                          slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                        />
                      </ListItem>
                    </ListItemButton>
                  </Box>
                </Tooltip>
              </>
            )}
            {showDuplicate && (
              <ListItemButton
                onClick={onDuplicate}
                sx={{
                  width: '100%',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'start',
                  flexDirection: 'column'
                }}
              >
                <ListItem sx={{ p: 0 }}>
                  <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                    <FileCopyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        component="div"
                        variant="body1"
                        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {t('common.duplicate')}
                      </Typography>
                    }
                    disableTypography
                    sx={{ m: 0 }}
                    slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                  />
                </ListItem>
              </ListItemButton>
            )}
            {showDelete && (
              <ListItemButton
                onClick={onDelete}
                sx={{
                  width: '100%',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'start',
                  flexDirection: 'column'
                }}
              >
                <ListItem sx={{ p: 0 }}>
                  <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                    <DeleteIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        component="div"
                        variant="body1"
                        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {t('ariaLabel.delete')}
                      </Typography>
                    }
                    disableTypography
                    sx={{ m: 0 }}
                    slotProps={{ primary: { sx: { fontWeight: 600, m: 0 } } }}
                  />
                </ListItem>
              </ListItemButton>
            )}
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
};
export const MoreActionDropdown = memo(MoreActionDropdownComponent);
