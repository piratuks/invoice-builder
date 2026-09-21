import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import { Provider } from 'react-redux';
import { pageSlice, setSettings } from '../../../../../state/pageSlice';
import { Themes } from '../../../../enums/themes';
import type { Settings } from '../../../../types/settings';
import { ThemeContext, ThemeProviderWrapper } from '../ThemeProviderWrapper';

const settings = (isDarkMode: boolean) => ({ isDarkMode }) as Settings;

const Consumer = () => {
  const { mode, toggleMode } = useContext(ThemeContext);
  return (
    <div>
      <span>{mode}</span>
      <button type="button" onClick={toggleMode}>
        toggle
      </button>
    </div>
  );
};

const renderTheme = (isDarkMode?: boolean) => {
  const testStore = configureStore({ reducer: { [pageSlice.name]: pageSlice.reducer } });
  if (isDarkMode !== undefined) testStore.dispatch(setSettings(settings(isDarkMode)));
  return render(
    <Provider store={testStore}>
      <ThemeProviderWrapper>
        <Consumer />
      </ThemeProviderWrapper>
    </Provider>
  );
};

describe('ThemeProviderWrapper', () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  it.each([
    [true, Themes.dark],
    [false, Themes.light]
  ])('uses the Redux preference when isDarkMode is %s', async (isDarkMode, expected) => {
    localStorage.setItem('latUsedTheme', expected === Themes.light ? Themes.dark : Themes.light);
    renderTheme(isDarkMode);

    await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument());
    expect(localStorage.getItem('latUsedTheme')).toBe(expected);
    expect(window.matchMedia).not.toHaveBeenCalled();
  });

  it.each([
    [Themes.light, Themes.light],
    [Themes.dark, Themes.dark],
    ['unexpected', Themes.dark]
  ])('uses a persisted %s theme without consulting system preference', async (saved, expected) => {
    localStorage.setItem('latUsedTheme', saved);
    renderTheme();

    await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument());
    expect(window.matchMedia).not.toHaveBeenCalled();
  });

  it.each([
    [true, Themes.dark],
    [false, Themes.light]
  ])('uses and persists the system preference when matches is %s', async (matches, expected) => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches } as MediaQueryList);
    renderTheme();

    await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument());
    expect(localStorage.getItem('latUsedTheme')).toBe(expected);
  });

  it('toggles mode and persists each choice', async () => {
    const user = userEvent.setup();
    localStorage.setItem('latUsedTheme', Themes.light);
    renderTheme();

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByText(Themes.dark)).toBeInTheDocument();
    expect(localStorage.getItem('latUsedTheme')).toBe(Themes.dark);
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByText(Themes.light)).toBeInTheDocument();
  });
});
