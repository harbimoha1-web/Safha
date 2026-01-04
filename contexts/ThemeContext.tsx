import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/stores';
import { colors, lightColors } from '@/constants';
import type { Theme } from '@/types';

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  // Current resolved color scheme
  colorScheme: ColorScheme;
  // Theme colors based on resolved scheme
  colors: typeof colors;
  // Whether dark mode is active
  isDark: boolean;
  // User's theme preference
  themeSetting: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { settings } = useAppStore();

  const value = useMemo<ThemeContextValue>(() => {
    // Resolve the actual color scheme
    let resolvedScheme: ColorScheme;

    if (settings.theme === 'system') {
      resolvedScheme = systemColorScheme === 'light' ? 'light' : 'dark';
    } else {
      resolvedScheme = settings.theme;
    }

    const isDark = resolvedScheme === 'dark';
    const themeColors = isDark ? colors : lightColors;

    return {
      colorScheme: resolvedScheme,
      colors: themeColors,
      isDark,
      themeSetting: settings.theme,
    };
  }, [settings.theme, systemColorScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Convenience hook that just returns the colors
export function useThemeColors(): typeof colors {
  const { colors: themeColors } = useTheme();
  return themeColors;
}
