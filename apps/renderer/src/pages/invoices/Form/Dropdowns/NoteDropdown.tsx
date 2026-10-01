import { Box, Grid, SwipeableDrawer, TextField, useMediaQuery, useTheme } from '@mui/material';
import { memo, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../shared/components/layout/pageHeader/PageHeader';

interface Props {
  isOpen: boolean;
  title: string;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: (note: string) => void;
  currentNote?: string;
}
const NoteDropdownComponent: FC<Props> = ({ isOpen, title, currentNote, onClose, onOpen, onClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [note, setNote] = useState<string>(currentNote ?? '');

  useEffect(() => {
    if (isOpen) {
      setNote(currentNote ?? '');
    }
  }, [isOpen, currentNote]);

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
              height: isDesktop ? '30%' : '40%',
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
            title={t('invoices.addNote')}
            showBack={false}
            showSave={true}
            showClose={false}
            formData={note}
            isFormValid={true}
            onClose={onClose}
            onSave={data => {
              onClick?.(data as string);
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <TextField
              label={title}
              fullWidth
              value={note}
              multiline
              rows={5}
              onChange={e => {
                setNote(e.target.value);
              }}
            />
          </Grid>
        </Grid>
      </SwipeableDrawer>
    </>
  );
};
export const NoteDropdown = memo(NoteDropdownComponent);
