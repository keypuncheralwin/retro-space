import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = "light" | "dark" | "retro" | "professional";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'app-theme';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light', // Default theme
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: THEME_STORAGE_KEY, // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
        if (state) {
          // This function is called when the store is rehydrated from localStorage
          // We can apply the theme to the document here if needed,
          // but ThemeProvider will also handle this on mount.
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);

// Helper function to get initial theme on the server (optional, for SSR consistency if needed)
// For now, we rely on client-side hydration and ThemeProvider
// export const getInitialServerTheme = (): Theme => 'light';
