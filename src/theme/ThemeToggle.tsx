import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-info hover:text-info focus:outline-none focus-visible:ring-2 focus-visible:ring-info"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span>{isLight ? 'Dark' : 'Light'}</span>
    </button>
  );
}
