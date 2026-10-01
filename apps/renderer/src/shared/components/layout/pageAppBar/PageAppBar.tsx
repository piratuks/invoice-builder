import { Box, Dialog, DialogContent, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useState, type FC, type ReactNode } from 'react';
import { ModalAppBar } from '../modalAppBar/ModalAppBar';
import { PageHeader } from '../pageHeader/PageHeader';

interface Props {
  isModal?: boolean;
  isOpen?: boolean;
  showBack?: boolean;
  title?: string;
  handleClose?: () => void;
  handleSave?: (data: unknown) => void;
  renderForm: (opts: { onChange: (properties: { changedData: unknown; isFormValid: boolean }) => void }) => ReactNode;
  renderCustomButtons?: () => ReactNode;
}
export const PageAppBar: FC<Props> = ({
  title,
  isOpen = false,
  isModal = true,
  showBack = true,
  handleClose = () => {},
  handleSave = () => {},
  renderForm,
  renderCustomButtons = () => null
}) => {
  const theme = useTheme();
  const [isFormValid, setIsFormValid] = useState(false);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<unknown | undefined>(undefined);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = useCallback(
    (properties: { changedData: unknown; isFormValid: boolean; description?: string }) => {
      setIsFormValid(properties.isFormValid);
      setFormData(properties.changedData);
      setDescription(properties.description);
    },
    []
  );

  const appBar = isModal ? (
    <ModalAppBar
      title={title}
      description={description}
      isFormValid={isFormValid}
      formData={formData}
      onClose={handleClose}
      onSave={data => handleSave(data)}
      renderCustomButtons={renderCustomButtons}
    />
  ) : (
    <PageHeader
      title={title}
      description={description}
      isFormValid={isFormValid}
      formData={formData}
      onBack={handleClose}
      showBack={showBack}
      showSave={true}
      onSave={data => handleSave(data)}
      renderCustomButtons={renderCustomButtons}
    />
  );

  const formContent = renderForm({
    onChange: handleChange
  });

  return (
    <>
      {isModal && (
        <Dialog fullScreen={isMobile} open={isOpen} onClose={handleClose}>
          {appBar}
          <DialogContent>{formContent}</DialogContent>
        </Dialog>
      )}
      {!isModal && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
          {appBar}
          {formContent}
        </Box>
      )}
    </>
  );
};
