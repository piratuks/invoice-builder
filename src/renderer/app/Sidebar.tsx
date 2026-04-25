import {
  Business,
  ChevronLeft,
  ChevronRight,
  Description,
  Folder,
  Inventory,
  People,
  Settings,
  TableChart
} from '@mui/icons-material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocalPostOfficeIcon from '@mui/icons-material/LocalPostOffice';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ScaleIcon from '@mui/icons-material/Scale';
import ViewModule from '@mui/icons-material/ViewModule';
import { Box, Divider, Drawer, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useCallback, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApi } from '../shared/api/restApi';
import { MenuList } from '../shared/components/lists/menuList/MenuList';
import type { MenuItem } from '../shared/types/menuItem';
import { useAppDispatch, useAppSelector } from '../state/configureStore';
import { selectSettings, selectVersion, setVersion } from '../state/pageSlice';
const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 60;

export const Sidebar: FC = () => {
  const dispatch = useAppDispatch();

  const theme = useTheme();
  const [open, setOpen] = useState(true);

  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const storeSettings = useAppSelector(selectSettings);
  const version = useAppSelector(selectVersion);

  const onClickNavigate = useCallback(
    (item: MenuItem) => {
      if (typeof item.path !== 'undefined') {
        navigate(item.path);
      }
    },
    [navigate]
  );

  const isSelected = useCallback(
    (item: MenuItem) => {
      return location.pathname === item.path;
    },
    [location]
  );

  const menuItems = [
    {
      groupName: t('common.documents'),
      groupIcon: <Folder />,
      isOpen: true,
      items: [
        {
          text: t('menuItems.invoices'),
          icon: <Description />,
          path: '/invoices',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        ...(storeSettings?.quotesON
          ? [
              {
                text: t('menuItems.quotes'),
                icon: <ReceiptIcon />,
                path: '/quotes',
                isToggle: false,
                minHeight: 50,
                isSelected: isSelected,
                onClick: onClickNavigate
              }
            ]
          : [])
      ]
    },
    ...(storeSettings?.presetsON || storeSettings?.styleProfilesON
      ? [
          {
            groupName: t('common.templates'),
            groupIcon: <ViewModule />,
            isOpen: true,
            items: [
              ...(storeSettings?.presetsON
                ? [
                    {
                      text: t('menuItems.presets'),
                      icon: <ContentCopyIcon />,
                      path: '/presets',
                      isToggle: false,
                      minHeight: 50,
                      isSelected: isSelected,
                      onClick: onClickNavigate
                    }
                  ]
                : []),
              ...(storeSettings?.styleProfilesON
                ? [
                    {
                      text: t('menuItems.styleProfiles'),
                      icon: <ColorLensIcon />,
                      path: '/styleProfiles',
                      isToggle: false,
                      minHeight: 50,
                      isSelected: isSelected,
                      onClick: onClickNavigate
                    }
                  ]
                : [])
            ]
          }
        ]
      : []),
    {
      groupName: t('common.data'),
      groupIcon: <TableChart />,
      isOpen: false,
      items: [
        {
          text: t('menuItems.banks'),
          icon: <AccountBalanceIcon />,
          path: '/banks',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        {
          text: t('menuItems.items'),
          icon: <Inventory />,
          path: '/items',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        {
          text: t('menuItems.currencies'),
          icon: <AttachMoneyIcon />,
          path: '/currencies',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        {
          text: t('menuItems.units'),
          icon: <ScaleIcon />,
          path: '/units',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        {
          text: t('menuItems.categories'),
          icon: <CategoryIcon />,
          path: '/categories',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        {
          text: t('menuItems.clients'),
          icon: <People />,
          path: '/clients',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        {
          text: t('menuItems.mailingLabels'),
          icon: <LocalPostOfficeIcon />,
          path: '/mailing-labels',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        },
        {
          text: t('menuItems.businesses'),
          icon: <Business />,
          path: '/businesses',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        }
      ]
    },
    {
      items: [
        ...(storeSettings?.reportsON
          ? [
              {
                text: t('menuItems.reports'),
                icon: <AssessmentIcon />,
                path: '/reports',
                isToggle: false,
                minHeight: 50,
                isSelected: isSelected,
                onClick: onClickNavigate
              }
            ]
          : []),
        {
          text: t('menuItems.settings'),
          icon: <Settings />,
          path: '/settings',
          isToggle: false,
          minHeight: 50,
          isSelected: isSelected,
          onClick: onClickNavigate
        }
      ]
    }
  ];

  const handleToggle = () => setOpen(!open);

  useEffect(() => {
    if (!isDesktop) {
      setOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    getApi()
      .getAppVersion()
      .then(v => dispatch(setVersion(v)));
  }, [dispatch]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRight: `1px solid ${theme.palette.divider}`,
          overflowX: 'hidden',
          transition: 'width 0.3s',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {isDesktop && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            px: 1,
            minHeight: 64
          }}
        >
          <Box sx={{ flexGrow: 1 }}></Box>
          {open && (
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                color: theme.palette.primary.main
              }}
            >
              {t(`app.title`)}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }}></Box>
          <Tooltip title={t('ariaLabel.menu')}>
            <IconButton onClick={handleToggle} aria-label={t('ariaLabel.menu')}>
              {open ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {isDesktop && <Divider />}

      <MenuList useTooltip={false} items={menuItems} showText={open} />

      <Box sx={{ p: 2 }}>
        <Divider />
        {open && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
            {t(`app.version`)}: {version}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};
