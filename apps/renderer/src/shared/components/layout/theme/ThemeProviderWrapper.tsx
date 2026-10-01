import { CssBaseline, ThemeProvider } from '@mui/material';
import React, { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAppSelector } from '../../../../state/configureStore';
import { selectSettings } from '../../../../state/pageSlice';
import { Themes } from '../../../enums/themes';
import { darkTheme, lightTheme } from './theme';

type ThemeMode = Themes;

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: Themes.light,
  toggleMode: () => {}
});

export const ThemeProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(Themes.light);
  const storeSettings = useAppSelector(selectSettings);

  useEffect(() => {
    const isDarkMode = storeSettings?.isDarkMode;
    if (typeof isDarkMode !== 'undefined') {
      const saved = isDarkMode ? Themes.dark : Themes.light;
      localStorage.setItem('latUsedTheme', saved);
      setMode(saved);
    } else {
      const lastUsedTheme = localStorage.getItem('latUsedTheme');
      if (lastUsedTheme) {
        const next = lastUsedTheme === Themes.light ? Themes.light : Themes.dark;
        setMode(next);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const newMode = prefersDark ? Themes.dark : Themes.light;
        localStorage.setItem('latUsedTheme', newMode);
        setMode(newMode);
      }
    }
  }, [storeSettings]);

  const toggleMode = () => {
    const next = mode === Themes.light ? Themes.dark : Themes.light;
    localStorage.setItem('latUsedTheme', next);
    setMode(next);
  };

  const theme = useMemo(() => (mode === Themes.light ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
