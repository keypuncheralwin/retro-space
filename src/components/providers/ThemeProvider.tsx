'use client';

import { useEffect } from 'react';
import { useThemeStore, Theme } from '@/stores/themeStore'; // Using absolute import

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme; // Optional: if you want to pass a server-side determined theme
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const { theme, setTheme } = useThemeStore();

  // Apply the theme from the store or defaultTheme on mount and when it changes.
  useEffect(() => {
    const currentTheme = theme || defaultTheme || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    // Optionally, update the store if defaultTheme is provided and store is not yet hydrated
    // This ensures consistency if the store's initial state differs from a server-provided theme.
    if (defaultTheme && theme !== defaultTheme) {
      // Be cautious with this, as it might cause an extra render or conflict if persist rehydration happens simultaneously.
      // For most cases, relying on persist's onRehydrateStorage and the initial store state is sufficient.
      // setTheme(defaultTheme); 
    }
  }, [theme, defaultTheme, setTheme]);
  
  // Effect to set initial theme if store is not yet hydrated and defaultTheme is not provided
  // This handles the very first load before Zustand hydration.
  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme');
    const initialTheme = storedTheme ? (JSON.parse(storedTheme).state.theme as Theme) : (defaultTheme || 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);
    if (theme !== initialTheme) {
        setTheme(initialTheme);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  return <>{children}</>;
}
