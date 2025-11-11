import { useThemeStore } from '@/stores/themeStore';
import type { Theme } from '@/stores/themeStore';

export interface UseThemeReturn {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  isLoading: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

/**
 * Hook to manage theme state using Zustand store
 * Provides theme state and actions for the application
 */
export function useTheme(): UseThemeReturn {
  const { theme, actualTheme, isLoading, setTheme } = useThemeStore();

  const toggleTheme = () => {
    const nextTheme: Theme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return {
    theme,
    actualTheme,
    isLoading,
    setTheme,
    toggleTheme,
    isDark: actualTheme === 'dark',
    isLight: actualTheme === 'light',
    isSystem: theme === 'system',
  };
}

// Convenience hooks for specific theme checks
export const useIsDarkTheme = () => useThemeStore((state) => state.actualTheme === 'dark');
export const useIsLightTheme = () => useThemeStore((state) => state.actualTheme === 'light');
export const useIsSystemTheme = () => useThemeStore((state) => state.theme === 'system');
export const useThemeLoading = () => useThemeStore((state) => state.isLoading);

// Action hooks
export const useThemeActions = () =>
  useThemeStore((state) => ({
    setTheme: state.setTheme,
    updateActualTheme: state.updateActualTheme,
    initializeTheme: state.initializeTheme,
  }));
