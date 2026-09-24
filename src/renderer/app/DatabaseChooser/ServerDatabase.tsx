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
import { useInitializeDatabaseMutation } from '../../shared/api/dbSelectorApi';
import { DatabaseType } from '../../shared/enums/databaseType';
import { DBInitType } from '../../shared/enums/dbInitType';
import type { PostgresConfig } from '../../shared/types/postgresConfig';
import { useAppDispatch } from '../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor } from '../../state/pageSlice';
import { ConnectionSetter } from './modals/ConnectionSetter';
import { PasswordSetter } from './modals/PasswordSetter';

interface Props {
  onDatabaseRead?: () => void;
}
export const ServerDatabase: FC<Props> = ({ onDatabaseRead }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { t } = useTranslation();

  const [connection, setConnection] = useState<PostgresConfig | undefined>(undefined);
  const [isDBConnectionModalOpen, setIsDBConnectionModalOpen] = useState(false);
  const [isDBPasswordModalOpen, setIsDBPasswordModalOpen] = useState(false);
  const handleSetupConnection = async () => {
    setIsDBConnectionModalOpen(true);
  };
  const [savedDbs, setSavedDbs] = useState<PostgresConfig[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializeDB, { isLoading: isInitializingDB }] = useInitializeDatabaseMutation();

  const reportError = useCallback(
    (error: unknown) => {
      const { message, key } = (error as { message?: string; key?: string }) ?? {};
      if (message) {
        dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
      } else if (key) {
        dispatch(addToast({ message: t(key), severity: 'error' }));
      }
    },
    [dispatch, t]
  );

  const startInitialization = useCallback(
    (config: PostgresConfig) => {
      setIsInitializing(true);
      void initializeDB({
        mode: DBInitType.create,
        postgresConfig: config,
        dbType: DatabaseType.postgre
      })
        .unwrap()
        .then(() => onDatabaseRead?.())
        .catch(reportError)
        .finally(() => setIsInitializing(false));
    },
    [initializeDB, onDatabaseRead, reportError]
  );

  useEffect(() => {
    if (!isInitializingDB) return;
    dispatch(enableLoadingCursor());
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [dispatch, isInitializingDB]);

  const isSameDb = (a: PostgresConfig, b: PostgresConfig) =>
    a.host === b.host && a.port === b.port && a.database === b.database && a.user === b.user;

  const saveDbList = useCallback(
    (list: PostgresConfig[]) => {
      const uniqueList = list.filter((item, index, self) => index === self.findIndex(p => isSameDb(p, item)));
      const sortedList = [...uniqueList].sort((a, b) => a.database.localeCompare(b.database));
      setSavedDbs(sortedList);
      try {
        localStorage.setItem('connetionData', JSON.stringify(sortedList));
      } catch {
        dispatch(addToast({ message: t('error.failedToSave'), severity: 'error' }));
      }
    },
    [t, dispatch]
  );

  const handleForget = (config: PostgresConfig) => {
    const updated = savedDbs.filter(
      p => p.host !== config.host || p.port !== config.port || p.database !== config.database || p.user !== config.user
    );
    saveDbList(updated);
  };

  const handleOpenSaved = useCallback(
    async (config: PostgresConfig) => {
      // Guard against duplicate/overlapping init calls (e.g. rapid double-clicks) which
      // can race with the backend's shared database connection and intermittently
      // fail with "database not initialized".
      if (isInitializing) return;
      const { password, ...rest } = config;
      void password;
      const newList = Array.from(new Set([rest, ...savedDbs]));
      saveDbList(newList);
      startInitialization(config);
    },
    [savedDbs, saveDbList, isInitializing, startInitialization]
  );

  useEffect(() => {
    if (connection?.password) handleOpenSaved(connection);
    if (connection && !connection.password) setIsDBPasswordModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('connetionData');
      if (raw) {
        setSavedDbs(JSON.parse(raw) as PostgresConfig[]);
      }

      const lastUsedLanguage = localStorage.getItem('lastUsedLanguage');
      if (lastUsedLanguage) i18n.changeLanguage(lastUsedLanguage);
    } catch {
      dispatch(addToast({ message: t('error.failedToLoad'), severity: 'error' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

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
      {isDBConnectionModalOpen && (
        <>
          <ConnectionSetter
            isOpen={isDBConnectionModalOpen}
            onCancel={() => setIsDBConnectionModalOpen(false)}
            onSave={(connection: PostgresConfig) => {
              setConnection(connection);
              setIsDBConnectionModalOpen(false);
            }}
          />
        </>
      )}
      {isDBPasswordModalOpen && (
        <>
          <PasswordSetter
            isOpen={isDBPasswordModalOpen}
            onCancel={() => {
              setIsDBPasswordModalOpen(false);
              setConnection(undefined);
            }}
            onSave={(password: string) => {
              if (connection)
                setConnection({
                  ...connection,
                  password: password
                });
              setIsDBPasswordModalOpen(false);
            }}
          />
        </>
      )}

      <Typography variant="h5" noWrap component="div" sx={{ color: theme.palette.secondary.main }}>
        {<>{t('databaseChooser.titleServer')}</>}
      </Typography>
      <Typography variant="body1" noWrap component="div" sx={{ whiteSpace: 'pre-wrap' }}>
        {<>{t('databaseChooser.descriptionServer')}</>}
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
        <Button variant="contained" onClick={handleSetupConnection} disabled={isInitializing}>
          {t('databaseChooser.connect')}
        </Button>
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
          {savedDbs.map((item, index) => {
            const authPart = encodeURIComponent(item.user);
            const sslPart = item.ssl ? '?sslmode=require' : '';
            const connectionString = `postgresql://${authPart}@${item.host}:${item.port}/${item.database}${sslPart}`;

            return (
              <Paper
                key={`server-${index}-${item.database}`}
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
                    setConnection(item);
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
                          {item.database}
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
                          {connectionString}
                        </Typography>
                      }
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

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
                  </Box>
                </ListItemButton>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
