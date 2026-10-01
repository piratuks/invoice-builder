import ArticleIcon from '@mui/icons-material/Article';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NoteIcon from '@mui/icons-material/Note';
import { Box, IconButton, ListItemButton, ListItemText, Tooltip, Typography } from '@mui/material';
import { memo, useCallback, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { NoteDropdown } from './Dropdowns/NoteDropdown';

enum NoteFormType {
  customer,
  thankyou,
  termsconditions
}
interface NoteForm {
  currentNote?: string;
  title: string;
  type: NoteFormType;
}
interface Props {
  data: {
    customerNotes?: string;
    thanksNotes?: string;
    termsConditionNotes?: string;
  };
  onCustomerNotesChanged: (value?: string) => void;
  onThanksNotesChanged: (value?: string) => void;
  onTermsConditionsNotesChanged: (value?: string) => void;
}
const NotesSelectorComponent: FC<Props> = ({
  data,
  onCustomerNotesChanged,
  onThanksNotesChanged,
  onTermsConditionsNotesChanged
}) => {
  const { customerNotes, thanksNotes, termsConditionNotes } = data;
  const { t } = useTranslation();

  const [isDropdownOpenNotes, setIsDropdownOpenNotes] = useState<boolean>(false);
  const [formData, setFormData] = useState<NoteForm | undefined>(undefined);

  const handleOnOpen = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  }, []);

  const handleOnClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  }, []);

  const notesConfig = [
    {
      type: NoteFormType.customer,
      label: t('invoices.customerNote'),
      value: customerNotes,
      icon: <NoteIcon fontSize="small" />
    },
    {
      type: NoteFormType.thankyou,
      label: t('invoices.thankNote'),
      value: thanksNotes,
      icon: <FavoriteIcon fontSize="small" />
    },
    {
      type: NoteFormType.termsconditions,
      label: t('invoices.termsConditions'),
      value: termsConditionNotes,
      icon: <ArticleIcon fontSize="small" />
    }
  ];

  return (
    <>
      {notesConfig.map(note => (
        <ListItemButton
          key={note.type}
          onClick={() => {
            setFormData({
              currentNote: note.value,
              title: note.label,
              type: note.type
            });
            handleOnOpen(setIsDropdownOpenNotes);
          }}
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
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <Tooltip title={note.label}>
                    <IconButton size="small" data-drag-handle onMouseDown={e => e.stopPropagation()}>
                      {note.icon}
                    </IconButton>
                  </Tooltip>
                  <Typography
                    component="div"
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: 'primary.main',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {note.label.toUpperCase()}
                  </Typography>
                </Box>
              }
              secondary={
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {note.value}
                </Typography>
              }
              disableTypography
              sx={{ m: 0 }}
              slotProps={{ primary: { sx: { fontWeight: 500, m: 0 } } }}
            />
          </Box>
        </ListItemButton>
      ))}

      {formData && (
        <NoteDropdown
          isOpen={isDropdownOpenNotes}
          onClose={() => handleOnClose(setIsDropdownOpenNotes)}
          onOpen={() => handleOnOpen(setIsDropdownOpenNotes)}
          onClick={data => {
            switch (formData.type) {
              case NoteFormType.customer:
                onCustomerNotesChanged(data);
                break;
              case NoteFormType.thankyou:
                onThanksNotesChanged(data);
                break;
              case NoteFormType.termsconditions:
                onTermsConditionsNotesChanged(data);
                break;
            }
            handleOnClose(setIsDropdownOpenNotes);
          }}
          currentNote={formData?.currentNote}
          title={formData.title}
        />
      )}
    </>
  );
};
export const NotesSelector = memo(NotesSelectorComponent);
