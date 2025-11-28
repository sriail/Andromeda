import { ThemeMode } from '../types/proxy';

const THEME_STORAGE_KEY = 'andromeda_theme';

/**
 * Load theme preference from localStorage
 */
export function loadTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidTheme(stored)) {
      return stored;
    }
  } catch {
    // Ignore errors
  }
  return 'system';
}

/**
 * Save theme preference to localStorage
 */
export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get the resolved theme (light or dark) based on theme mode and system preference
 */
export function getResolvedTheme(themeMode: ThemeMode): 'light' | 'dark' {
  if (themeMode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themeMode;
}

/**
 * Apply theme to document
 */
export function applyTheme(resolvedTheme: 'light' | 'dark'): void {
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Update favicon based on theme
 */
export function updateFavicon(resolvedTheme: 'light' | 'dark'): void {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    // In light mode, use dark favicon; in dark mode, use light favicon
    favicon.href = resolvedTheme === 'dark' 
      ? '/images/favicon_light.png' 
      : '/images/favicon_dark.png';
  }
}

/**
 * Get the logo path based on theme
 */
export function getLogoPath(resolvedTheme: 'light' | 'dark'): string {
  // In light mode, use dark logo; in dark mode, use light logo
  return resolvedTheme === 'dark' 
    ? '/images/andromeda-logo-light.png' 
    : '/images/andromeda_logo_dark.png';
}

// Type guard
function isValidTheme(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export type { ThemeMode };
