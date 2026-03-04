import { DarkMode, Description, FileDownload, Language, LightMode } from '@mui/icons-material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CoffeeIcon from '@mui/icons-material/Coffee';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoIcon from '@mui/icons-material/Info';
import PolicyIcon from '@mui/icons-material/Policy';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShareIcon from '@mui/icons-material/Share';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Card, CardContent, Grid, Typography, useTheme } from '@mui/material';
import { useContext, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getApi, isWebMode } from '../../../shared/api/restApi';
import { ThemeContext } from '../../../shared/components/layout/theme/ThemeProviderWrapper';
import { MenuList } from '../../../shared/components/lists/menuList/MenuList';
import { MenuItemSettings } from '../../../shared/enums/menuItemSettings';
import { Themes } from '../../../shared/enums/themes';
import { useAppDispatch, useAppSelector } from '../../../state/configureStore';
import { selectSettings, selectUpdateMessage, setUpdateMessage } from '../../../state/pageSlice';

interface Props {
  onSelected?: (key: MenuItemSettings | undefined) => void;
  selectedMenu?: MenuItemSettings | undefined;
  onModeChange?: (isDark: boolean) => void;
  toggleQuotes?: (value: boolean) => void;
  toggleReports?: (value: boolean) => void;
  toggleStyleProfiles?: (value: boolean) => void;
  togglePresets?: (value: boolean) => void;
  toggleUBL?: (value: boolean) => void;
  onExportJSON?: () => void;
  onImportJSON?: () => void;
}
export const Menu: FC<Props> = ({
  onSelected = () => {},
  selectedMenu,
  toggleQuotes = () => {},
  toggleReports = () => {},
  toggleStyleProfiles = () => {},
  togglePresets = () => {},
  toggleUBL = () => {},
  onModeChange = () => {},
  onExportJSON = () => {},
  onImportJSON = () => {}
}) => {
  const { mode, toggleMode } = useContext(ThemeContext);
  const { t } = useTranslation();
  const theme = useTheme();
  const storeSettings = useAppSelector(selectSettings);
  const updateMessage = useAppSelector(selectUpdateMessage);
  const dispatch = useAppDispatch();

  const personalization = [
    {
      items: [
        {
          text: t('settingsMenuItems.titles.languageFormat'),
          description: t('settingsMenuItems.descriptions.languageFormat'),
          icon: <Language />,
          isToggle: false,
          isSelected: MenuItemSettings.LanguageFormat === selectedMenu,
          onClick: () => onSelected(MenuItemSettings.LanguageFormat)
        },
        {
          text: t('settingsMenuItems.titles.customizeInvoice'),
          description: t('settingsMenuItems.descriptions.customizeInvoice'),
          icon: <Description />,
          isToggle: false,
          isSelected: MenuItemSettings.Receipt === selectedMenu,
          onClick: () => onSelected(MenuItemSettings.Receipt)
        },
        {
          text: t('settingsMenuItems.titles.darkMode'),
          description: t('settingsMenuItems.descriptions.darkMode'),
          icon: mode === Themes.light ? <DarkMode /> : <LightMode />,
          isToggle: true,
          isSelected: false,
          checked: mode === Themes.dark,
          onChange: () => {
            toggleMode();
            onModeChange(mode === Themes.light);
          }
        }
      ]
    }
  ];

  const featureToggles = [
    {
      items: [
        {
          text: t('settingsMenuItems.titles.turnQuotes'),
          description: t('settingsMenuItems.descriptions.turnQuotes'),
          icon: <ReceiptIcon />,
          isToggle: true,
          isSelected: false,
          checked: storeSettings?.quotesON ?? true,
          onChange: () => {
            toggleQuotes(!storeSettings?.quotesON);
          }
        },
        {
          text: t('settingsMenuItems.titles.turnReports'),
          description: t('settingsMenuItems.descriptions.turnReports'),
          icon: <AssessmentIcon />,
          isToggle: true,
          isSelected: false,
          checked: storeSettings?.reportsON ?? true,
          onChange: () => {
            toggleReports(!storeSettings?.reportsON);
          }
        },
        {
          text: t('settingsMenuItems.titles.turnStyleProfiles'),
          description: t('settingsMenuItems.descriptions.turnStyleProfiles'),
          icon: <ColorLensIcon />,
          isToggle: true,
          isSelected: false,
          checked: storeSettings?.styleProfilesON ?? true,
          onChange: () => {
            toggleStyleProfiles(!storeSettings?.styleProfilesON);
          }
        },
        {
          text: t('settingsMenuItems.titles.turnPresets'),
          description: t('settingsMenuItems.descriptions.turnPresets'),
          icon: <ContentCopyIcon />,
          isToggle: true,
          isSelected: false,
          checked: storeSettings?.presetsON ?? true,
          onChange: () => {
            togglePresets(!storeSettings?.presetsON);
          }
        },
        {
          text: t('settingsMenuItems.titles.turnUBL'),
          description: t('settingsMenuItems.descriptions.turnUBL'),
          icon: <ReceiptLongIcon />,
          isToggle: true,
          isSelected: false,
          checked: storeSettings?.ublON ?? true,
          onChange: () => {
            toggleUBL(!storeSettings?.ublON);
          }
        },
        {
          text: t('settingsMenuItems.titles.turnXRechnung'),
          description: t('settingsMenuItems.descriptions.turnXRechnung'),
          icon: <ReceiptLongIcon />,
          isToggle: true,
          isSelected: false,
          checked: storeSettings?.xrechnungON ?? true,
          onChange: () => {
            toggleUBL(!storeSettings?.xrechnungON);
          }
        }
      ]
    }
  ];

  const appBackup = [
    {
      items: [
        {
          text: t('settingsMenuItems.titles.import'),
          description: t('settingsMenuItems.descriptions.import'),
          icon: <UploadFileIcon />,
          isSelected: false,
          isToggle: false,
          onClick: onImportJSON
        },
        {
          text: t('settingsMenuItems.titles.export'),
          description: t('settingsMenuItems.descriptions.export'),
          icon: <FileDownload />,
          isSelected: false,
          isToggle: false,
          onClick: onExportJSON
        }
      ]
    }
  ];

  const githubLinks = [
    {
      items: [
        {
          text: t('settingsMenuItems.titles.share'),
          description: t('settingsMenuItems.descriptions.share'),
          icon: <ShareIcon />,
          isSelected: false,
          isToggle: false,
          onClick: () => {
            getApi().openUrl('https://github.com/piratuks/invoice-builder');
          }
        },
        {
          text: t('settingsMenuItems.titles.tutorial'),
          description: t('settingsMenuItems.descriptions.tutorial'),
          icon: <PolicyIcon />,
          isSelected: false,
          isToggle: false,
          onClick: () => {
            getApi().openUrl('https://github.com/piratuks/invoice-builder/blob/main/TUTORIAL.md');
          }
        },
        {
          text: t('settingsMenuItems.titles.support'),
          description: t('settingsMenuItems.descriptions.support'),
          icon: <SupportAgentIcon />,
          isSelected: false,
          isToggle: false,
          onClick: () => {
            getApi().openUrl('https://github.com/piratuks/invoice-builder/issues');
          }
        },
        {
          text: t('settingsMenuItems.titles.privacyPolicy'),
          description: t('settingsMenuItems.descriptions.privacyPolicy'),
          icon: <PolicyIcon />,
          isSelected: false,
          isToggle: false,
          onClick: () => {
            getApi().openUrl('https://github.com/piratuks/invoice-builder/blob/main/PRIVACY-POLICY.md');
          }
        },
        {
          text: t('settingsMenuItems.titles.about'),
          description: t('settingsMenuItems.descriptions.about'),
          icon: <InfoIcon />,
          isToggle: false,
          isSelected: false,
          onClick: () => {
            getApi().openUrl('https://github.com/piratuks/invoice-builder/blob/main/TERMS-OF-USE.md');
          }
        }
      ]
    }
  ];

  const appUpdater = [
    {
      items: [
        ...(!isWebMode()
          ? [
              {
                text: t('settingsMenuItems.titles.checkForUpdate'),
                description: updateMessage,
                icon: <AutorenewIcon />,
                isToggle: false,
                isSelected: false,
                onClick: () => {
                  dispatch(setUpdateMessage(t('common.checking')));
                  getApi().checkForUpdates();
                }
              }
            ]
          : [])
      ]
    }
  ];

  const appPromotion = [
    {
      items: [
        {
          text: t('settingsMenuItems.titles.buyMeCoffee'),
          description: t('settingsMenuItems.descriptions.buyMeCoffee'),
          icon: <CoffeeIcon />,
          isToggle: false,
          isSelected: false,
          onClick: () => {
            getApi().openUrl('https://www.buymeacoffee.com/evaldizi');
          }
        },
        {
          text: t('settingsMenuItems.titles.wallOfFame'),
          description: t('settingsMenuItems.descriptions.wallOfFame'),
          icon: <EmojiEventsIcon />,
          isToggle: false,
          isSelected: false,
          onClick: () => {
            getApi().openUrl('https://github.com/piratuks/invoice-builder/blob/main/SUPPORTERS.md');
          }
        }
      ]
    }
  ];

  return (
    <>
      <Grid size={{ xs: 12, md: 4 }} component="div" sx={{ position: 'relative', height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{
              color: theme.palette.secondary.main
            }}
          >
            {t('menuItems.settings')}
          </Typography>
          <Card>
            <CardContent>
              <MenuList useTooltip={false} items={personalization} showText={true} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <MenuList useTooltip={false} items={featureToggles} showText={true} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <MenuList useTooltip={false} items={appBackup} showText={true} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <MenuList useTooltip={false} items={githubLinks} showText={true} />
            </CardContent>
          </Card>
          {!isWebMode() && (
            <Card>
              <CardContent>
                <MenuList useTooltip={false} items={appUpdater} showText={true} />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent>
              <MenuList useTooltip={false} items={appPromotion} showText={true} />
            </CardContent>
          </Card>
        </Box>
      </Grid>
    </>
  );
};
