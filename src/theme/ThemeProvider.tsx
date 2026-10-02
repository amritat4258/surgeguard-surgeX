import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'surgeguard-theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable: fall through to default */
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Hex colors for SVG/chart props that cannot read CSS variables. */
export function useChartColors() {
  const { theme } = useTheme();
  return theme === 'light'
    ? {
        grid: '#f6cfe0',
        axis: '#9a6580',
        tooltipBg: '#ffffff',
        tooltipBorder: '#f6cfe0',
        tooltipText: '#281622',
        actual: '#db2777',
        forecast: '#ea580c',
        danger: '#dc2626',
      }
    : {
        grid: '#334155',
        axis: '#64748b',
        tooltipBg: '#0f172a',
        tooltipBorder: '#334155',
        tooltipText: '#e2e8f0',
        actual: '#38bdf8',
        forecast: '#f97316',
        danger: '#ef4444',
      };
}
