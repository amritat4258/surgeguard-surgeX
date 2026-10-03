import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'night' | 'daylight' | 'projector';

export { useChartColors } from './useThemeTokens';

export interface TransitionOrigin {
  x: number;
  y: number;
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (origin?: TransitionOrigin) => void;
  toggle: (origin?: TransitionOrigin) => void;
  setTheme: (t: Theme, origin?: TransitionOrigin) => void;
}

const STORAGE_KEY = 'surgeguard-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_COLORS: Record<Theme, string> = {
  night: '#060A16',
  daylight: '#F6F3EE',
  projector: '#020408',
};

/**
 * Read and migrate legacy theme keys.
 * Legacy 'dark' -> 'night', 'light' -> 'daylight'.
 * If no stored theme, detect prefers-color-scheme (never auto-select projector).
 */
export function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'night';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'night' || saved === 'daylight' || saved === 'projector') {
      return saved;
    }
    // Migration of legacy values
    if (saved === 'dark') {
      localStorage.setItem(STORAGE_KEY, 'night');
      return 'night';
    }
    if (saved === 'light') {
      localStorage.setItem(STORAGE_KEY, 'daylight');
      return 'daylight';
    }
    // First visit: system preference check
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'daylight' : 'night';
  } catch {
    return 'night';
  }
}

/** Apply DOM attributes, classes, color-scheme, and meta tag */
export function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = theme;
  // Keep dark class on for night and projector so existing dark: utilities work
  const isDark = theme !== 'daylight';
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';

  // Update theme-color meta tag
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', THEME_COLORS[theme] || '#060A16');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  // Sync initial theme to DOM immediately on mount
  useEffect(() => {
    applyThemeToDOM(theme);
  }, []);

  const changeTheme = useCallback((nextTheme: Theme, origin?: TransitionOrigin) => {
    // Save to storage immediately
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      /* ignore */
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Use View Transitions API if supported and not reduced-motion
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !prefersReducedMotion
    ) {
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const root = document.documentElement;
      root.style.setProperty('--reveal-x', `${x}px`);
      root.style.setProperty('--reveal-y', `${y}px`);
      root.style.setProperty('--reveal-r', `${endRadius}px`);

      // Type cast document with startViewTransition
      const docWithVT = document as unknown as {
        startViewTransition: (cb: () => void) => { ready: Promise<void> };
      };

      try {
        docWithVT.startViewTransition(() => {
          flushSync(() => {
            setThemeState(nextTheme);
            applyThemeToDOM(nextTheme);
          });
        });
        return;
      } catch {
        // Fallback if transition fails
      }
    }

    // Direct apply if View Transitions not available
    setThemeState(nextTheme);
    applyThemeToDOM(nextTheme);
  }, []);

  const setTheme = useCallback(
    (t: Theme, origin?: TransitionOrigin) => {
      changeTheme(t, origin);
    },
    [changeTheme]
  );

  const toggle = useCallback(
    (origin?: TransitionOrigin) => {
      const next: Theme = theme === 'night' ? 'daylight' : 'night';
      changeTheme(next, origin);
    },
    [theme, changeTheme]
  );

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: toggle,
      toggle,
      setTheme,
    }),
    [theme, toggle, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
