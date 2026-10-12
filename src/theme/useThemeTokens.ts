import { useMemo } from 'react';
import { useTheme } from './ThemeProvider';
import type { Theme } from './ThemeProvider';

/**
 * Resolve a CSS variable value from document.documentElement.
 */
export function getToken(varName: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  const name = varName.startsWith('--') ? varName : `--${varName}`;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

/**
 * Resolve a color token as an rgb(...) or hex string.
 */
export function getRgbToken(varName: string, fallback = ''): string {
  const raw = getToken(varName, fallback);
  if (!raw) return fallback;
  if (raw.startsWith('#') || raw.startsWith('rgb')) return raw;
  return `rgb(${raw})`;
}

export interface ResolvedThemeTokens {
  theme: Theme;
  isDark: boolean;
  surface: {
    base: string;
    panel: string;
    raised: string;
    border: string;
  };
  text: {
    ink: string;
    body: string;
    muted: string;
  };
  risk: {
    normal: string;
    warning: string;
    high: string;
    critical: string;
  };
  info: string;
  chart: {
    grid: string;
    axis: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    actual: string;
    forecast: string;
    danger: string;
  };
  map: {
    boundary: string;
    structure: string;
    structureBorder: string;
    walkway: string;
    arena: string;
    arenaBorder: string;
    food: string;
    foodBorder: string;
  };
}

/**
 * Hook that resolves computed theme tokens and causes consuming components
 * to re-render when the active theme changes.
 */
export function useThemeTokens(): ResolvedThemeTokens {
  const { theme } = useTheme();

  return useMemo(() => {
    const isDark = theme !== 'daylight';

    return {
      theme,
      isDark,
      surface: {
        base: getRgbToken('--color-surface-base', isDark ? '#060a16' : '#f6f3ee'),
        panel: getRgbToken('--color-surface-panel', isDark ? '#0c1224' : '#ffffff'),
        raised: getRgbToken('--color-surface-raised', isDark ? '#121a30' : '#f0ece4'),
        border: getRgbToken('--color-surface-border', isDark ? '#1e2a44' : '#e2dcd2'),
      },
      text: {
        ink: getRgbToken('--color-ink', isDark ? '#ffffff' : '#1c1a17'),
        body: getRgbToken('--color-body', isDark ? '#cbd5e1' : '#44403c'),
        muted: getRgbToken('--color-muted', isDark ? '#94a3b8' : '#78716c'),
      },
      risk: {
        normal: getRgbToken('--color-risk-normal', isDark ? '#22c55e' : '#15803d'),
        warning: getRgbToken('--color-risk-warning', isDark ? '#f59e0b' : '#b45309'),
        high: getRgbToken('--color-risk-high', isDark ? '#f97316' : '#c2410c'),
        critical: getRgbToken('--color-risk-critical', isDark ? '#ef4444' : '#b91c1c'),
      },
      info: getRgbToken('--color-info', isDark ? '#06b6d4' : '#0284c7'),
      chart: {
        grid: getRgbToken('--color-chart-grid', isDark ? '#334155' : '#e2dcd2'),
        axis: getRgbToken('--color-chart-axis', isDark ? '#64748b' : '#78716c'),
        tooltipBg: getRgbToken('--color-chart-tooltip-bg', isDark ? '#0f172a' : '#ffffff'),
        tooltipBorder: getRgbToken('--color-chart-tooltip-border', isDark ? '#334155' : '#d6d1c9'),
        tooltipText: getRgbToken('--color-chart-tooltip-text', isDark ? '#e2e8f0' : '#1c1a17'),
        actual: getRgbToken('--color-chart-actual', isDark ? '#38bdf8' : '#0284c7'),
        forecast: getRgbToken('--color-chart-forecast', isDark ? '#f97316' : '#c2410c'),
        danger: getRgbToken('--color-chart-danger', isDark ? '#ef4444' : '#b91c1c'),
      },
      map: {
        boundary: getRgbToken('--color-map-boundary', isDark ? '#334155' : '#d6d1c9'),
        structure: getRgbToken('--color-map-structure', isDark ? '#0f172a' : '#f0ece4'),
        structureBorder: getRgbToken('--color-map-structure-border', isDark ? '#1e2a44' : '#c8c1b6'),
        walkway: getRgbToken('--color-map-walkway', isDark ? '#475569' : '#a8a29e'),
        arena: getRgbToken('--color-map-arena', isDark ? '#1e1b4b' : '#e0e7ff'),
        arenaBorder: getRgbToken('--color-map-arena-border', isDark ? '#818cf8' : '#6366f1'),
        food: getRgbToken('--color-map-food', isDark ? '#022c22' : '#d1fae5'),
        foodBorder: getRgbToken('--color-map-food-border', '#10b981'),
      },
    };
  }, [theme]);
}

/**
 * Chart color helper maintaining backward compatibility with TrendChart.
 */
export function useChartColors() {
  const { chart } = useThemeTokens();
  return chart;
}
