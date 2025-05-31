'use client';

import { useThemeStore, Theme } from '@/stores/themeStore';

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const themes: Theme[] = ["light", "dark", "retro", "professional"];

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value as Theme);
  };

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
      <label htmlFor="theme-select" style={{ marginRight: '0.5rem', color: 'hsl(var(--foreground))' }}>Theme:</label>
      <select
        id="theme-select"
        value={theme}
        onChange={handleThemeChange}
        style={{
          padding: '0.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          cursor: 'pointer'
        }}
      >
        {themes.map((t) => (
          <option key={t} value={t} style={{ backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))'}}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
