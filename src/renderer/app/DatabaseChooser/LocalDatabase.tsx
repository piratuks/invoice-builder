import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemButton,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { isWebMode } from '../../shared/api/restApi';
import { DatabaseType } from '../../shared/enums/databaseType';
import { DBInitType } from '../../shared/enums/dbInitType';
import { useDBInit } from '../../shared/hooks/dbSelector/useDBInit';
import { useDBListSelector } from '../../shared/hooks/dbSelector/useDBListSelector';
import { useDBOpener } from '../../shared/hooks/dbSelector/useDBOpener';
import { useDBSelector } from '../../shared/hooks/dbSelector/useDBSelector';
import type { DBSelector } from '../../shared/types/dbSelector';
import type { Response } from '../../shared/types/response';
import { useAppDispatch } from '../../state/configureStore';
import { addToast } from '../../state/pageSlice';
import { NameSetter } from './modals/NameSetter';

interface Props {
  onDatabaseRead?: () => void;
}
export const LocalDatabase: FC<Props> = ({ onDatabaseRead }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [savedDbs, setSavedDbs] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<DBInitType | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDBSetterModalOpen, setIsDBSetterModalOpen] = useState(false);

  const { execute: getDBList } = useDBListSelector({
    immediate: false,
    onDone: (results: Response<string[]>) => {
      if (results.data) {
        setSavedDbs(results.data);
      }
    }
  });

  const { execute: selectDB } = useDBSelector({
    immediate: false,
    onDone: (results: Response<DBSelector>) => {
      if (results.data && !results.data.canceled && results.data.filePath) {
        setSelectionMode(DBInitType.create);
        setSelectedPath(results.data.filePath);
      }
    }
  });

  const { execute: openDB } = useDBOpener({
    immediate: false,
    onDone: (results: Response<DBSelector>) => {
      if (results.data && !results.data.canceled && results.data.filePath) {
        setSelectionMode(DBInitType.open);
        setSelectedPath(results.data.filePath);
      }
    }
  });

  const { execute: initDB } = useDBInit({
    fullPath: selectedPath ?? '',
    mode: selectionMode,
    dbType: DatabaseType.sqlite,
    immediate: false,
    onDone: (data: Response<unknown>) => {
      if (!data.success) {
        setSelectedPath(null);
        if (data.message) {
          const message = i18n.exists(data.message) ? t(data.message) : data.message;
          dispatch(addToast({ message: message, severity: 'error' }));
        } else if (data.key) dispatch(addToast({ message: t(data.key), severity: 'error' }));
      } else {
        if (onDatabaseRead) onDatabaseRead();
      }
      setIsInitializing(false);
    }
  });

  const saveDbList = useCallback(
    (list: string[]) => {
      const sortedList = [...list].sort((a, b) => a.localeCompare(b));
      setSavedDbs(sortedList);
      try {
        localStorage.setItem('databases', JSON.stringify(sortedList));
      } catch {
        dispatch(addToast({ message: t('error.failedToSave'), severity: 'error' }));
      }
    },
    [t, dispatch]
  );

  const handleOpenSaved = useCallback(
    async (fullPath: string) => {
      // Guard against duplicate/overlapping init calls (e.g. rapid double-clicks) which
      // can race with the backend's shared database connection and intermittently
      // fail with "database not initialized".
      if (isInitializing) return;
      const newList = Array.from(new Set([fullPath, ...savedDbs]));
      saveDbList(newList);
      setIsInitializing(true);
      initDB();
    },
    [savedDbs, initDB, saveDbList, isInitializing]
  );

  const handleSelectPath = async () => {
    if (isWebMode()) {
      setIsDBSetterModalOpen(true);
    } else {
      selectDB();
    }
  };

  const handleOpenPath = () => {
    openDB();
  };

  const handleForget = (fullPath: string) => {
    const updated = savedDbs.filter(p => p !== fullPath);
    saveDbList(updated);
  };

  const getFileName = (fullPath: string) => fullPath.split(/[/\\]/).pop() ?? fullPath;

  useEffect(() => {
    if (selectedPath && selectionMode) handleOpenSaved(selectedPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, selectionMode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('databases');
      if (raw) {
        setSavedDbs(JSON.parse(raw) as string[]);
      }

      const lastUsedLanguage = localStorage.getItem('lastUsedLanguage');
      if (lastUsedLanguage) i18n.changeLanguage(lastUsedLanguage);
    } catch {
      dispatch(addToast({ message: t('error.failedToLoad'), severity: 'error' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (isWebMode()) getDBList();
  }, [getDBList]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'start',
        gap: 3
      }}
    >
      {isWebMode() && isDBSetterModalOpen && (
        <>
          <NameSetter
            isOpen={isDBSetterModalOpen}
            onCancel={() => setIsDBSetterModalOpen(false)}
            onSave={name => {
              setSelectionMode(DBInitType.create);
              setSelectedPath(`${name}.db`);
              setIsDBSetterModalOpen(false);
            }}
          />
        </>
      )}

      <Typography variant="h5" noWrap component="div" sx={{ color: theme.palette.secondary.main }}>
        {!isWebMode() && <>{t('databaseChooser.title')}</>}
        {isWebMode() && <>{t('databaseChooser.titleWeb')}</>}
      </Typography>
      <Typography variant="body1" noWrap component="div" sx={{ whiteSpace: 'pre-wrap' }}>
        {!isWebMode() && <>{t('databaseChooser.description')}</>}
        {isWebMode() && <>{t('databaseChooser.descriptionWeb')}</>}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3
        }}
      >
        <Button variant="contained" onClick={handleSelectPath} disabled={isInitializing}>
          {t('databaseChooser.createNew')}
        </Button>
        {!isWebMode() && (
          <Button variant="contained" onClick={handleOpenPath} disabled={isInitializing}>
            {t('databaseChooser.openExisting')}
          </Button>
        )}
      </Box>

      {savedDbs.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fit, 300px)',
            justifyContent: 'center',
            justifyItems: 'center',
            alignItems: 'center',
            width: '100%'
          }}
        >
          {savedDbs.map(item => (
            <Paper
              key={item}
              elevation={2}
              sx={{
                borderRadius: 1,
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                transition: 'all 0.2s ease-in-out',
                width: '300px',
                height: '100%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ListItemButton
                disabled={isInitializing}
                onClick={() => {
                  if (isInitializing) return;
                  setSelectionMode(DBInitType.open);
                  setSelectedPath(item);
                }}
                sx={{
                  pt: 2,
                  pb: 2,
                  pl: 2,
                  pr: 2,
                  width: '100%',
                  borderRadius: 1,
                  display: 'flex',
                  height: '100%',
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
                    height: '100%'
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        component="div"
                        variant="body1"
                        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {getFileName(item)}
                      </Typography>
                    }
                    disableTypography
                    slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                    secondary={
                      <Typography
                        component="div"
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: 'small',
                          fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}
                      >
                        {item}
                      </Typography>
                    }
                  />

                  <Box sx={{ flexGrow: 1 }} />

                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                  {!isWebMode() && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={t('ariaLabel.remove')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={e => {
                            e.stopPropagation();
                            handleForget(item);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </ListItemButton>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};
