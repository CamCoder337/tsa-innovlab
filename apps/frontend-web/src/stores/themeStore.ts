import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    __themeCleanup?: () => void;
  }
}

interface ThemeState {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  isLoading: boolean;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  updateActualTheme: () => void;
  initializeTheme: () => void;
}

interface ThemeStore extends ThemeState, ThemeActions {}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDOM = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;

  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      theme: 'light',
      actualTheme: 'light',
      isLoading: true,

      // Actions
      setTheme: (newTheme: Theme) => {
        set({ theme: newTheme });
        get().updateActualTheme();
      },

      updateActualTheme: () => {
        const { theme } = get();
        const systemTheme = getSystemTheme();
        const effectiveTheme = theme === 'system' ? systemTheme : theme;

        applyThemeToDOM(effectiveTheme);
        set({ actualTheme: effectiveTheme });
      },

      initializeTheme: () => {
        const { updateActualTheme } = get();
        updateActualTheme();

        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const { theme } = get();
            if (theme === 'system') {
              updateActualTheme();
            }
          };

          mediaQuery.addEventListener('change', handleChange);

          // Store cleanup function for potential future use
          window.__themeCleanup = () => {
            mediaQuery.removeEventListener('change', handleChange);
          };
        }

        set({ isLoading: false });
      },
    }),
    {
      name: 'tsa-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);

// Initialize theme on store creation
if (typeof window !== 'undefined') {
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    useThemeStore.getState().initializeTheme();
  }, 0);
}
