import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ThemeMode } from '../types/proxy';
import { loadTheme, saveTheme, getResolvedTheme, applyTheme, updateFavicon, getLogoPath } from '../utils/theme';

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  logoPath: string;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => loadTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => getResolvedTheme(loadTheme()));

  const updateTheme = useCallback((mode: ThemeMode) => {
    const resolved = getResolvedTheme(mode);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    updateFavicon(resolved);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    saveTheme(mode);
    updateTheme(mode);
  }, [updateTheme]);

  // Initial theme application and system preference listener
  useEffect(() => {
    updateTheme(themeMode);

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        updateTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, updateTheme]);

  const logoPath = getLogoPath(resolvedTheme);

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, logoPath, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
