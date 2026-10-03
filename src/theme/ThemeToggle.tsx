import { useState, useRef, useEffect, useCallback } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Moon, Sun, Tv, ChevronDown, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import type { Theme } from './ThemeProvider';

interface ThemeOption {
  id: Theme;
  label: string;
  icon: typeof Moon;
  description: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'night',
    label: 'Night Ops',
    icon: Moon,
    description: 'Control room default dark language',
  },
  {
    id: 'daylight',
    label: 'Daylight',
    icon: Sun,
    description: 'Warm-neutral editorial daytime mode',
  },
  {
    id: 'projector',
    label: 'Projector',
    icon: Tv,
    description: 'High-contrast large display presentation mode',
  },
];

export function ThemeToggle() {
  const { theme, setTheme, toggle } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isDaylight = theme === 'daylight';
  const activeOption = THEME_OPTIONS.find((o) => o.id === theme) || THEME_OPTIONS[0];

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Main button toggle: switches between Night Ops and Daylight
  const handleToggleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = {
      x: e.clientX || rect.left + rect.width / 2,
      y: e.clientY || rect.top + rect.height / 2,
    };
    toggle(origin);
  };

  // Menu selection handler
  const handleSelectTheme = (t: Theme, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = {
      x: e.clientX || rect.left + rect.width / 2,
      y: e.clientY || rect.top + rect.height / 2,
    };
    setTheme(t, origin);
    setIsOpen(false);
  };

  // Keyboard navigation inside dropdown menu
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
    if (!items || items.length === 0) return;

    const currentIndex = Array.from(items).findIndex((item) => item === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="relative inline-flex items-center rounded-lg border border-surface-border bg-surface-panel shadow-sm transition hover:border-surface-border/80"
    >
      {/* 1. Main Sun/Moon Toggle Button */}
      <button
        type="button"
        onClick={handleToggleClick}
        aria-label={`Current theme: ${activeOption.label}. Click to switch between Night Ops and Daylight.`}
        title={`Current: ${activeOption.label} (Click to toggle Night/Daylight)`}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:text-info focus:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-1 rounded-l-lg"
      >
        {/* Animated Sun / Moon Morph Icon */}
        <div className="relative h-4 w-4 shrink-0 overflow-hidden" aria-hidden="true">
          {/* Sun Icon */}
          <Sun
            className={`absolute inset-0 h-4 w-4 text-amber-500 transition-all duration-300 ease-out motion-reduce:transition-none ${
              isDaylight
                ? 'rotate-0 scale-100 opacity-100'
                : 'rotate-90 scale-0 opacity-0'
            }`}
          />
          {/* Moon Icon */}
          <Moon
            className={`absolute inset-0 h-4 w-4 text-sky-400 transition-all duration-300 ease-out motion-reduce:transition-none ${
              !isDaylight
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </div>

        {/* Active Theme Label */}
        <span className="font-display font-medium">{activeOption.label}</span>
      </button>

      {/* Divider */}
      <span className="h-4 w-px bg-surface-border" aria-hidden="true" />

      {/* 2. Menu Trigger for 3-Theme Selector */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Theme selector menu: Night Ops, Daylight, Projector"
        className="flex items-center px-2 py-1.5 text-slate-400 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-info rounded-r-lg transition-colors"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-info' : ''
          }`}
        />
      </button>

      {/* 3. Accessible Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Theme options"
          className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-surface-border bg-surface-panel p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-surface-border/50 mb-1">
            Display Mode
          </div>

          {THEME_OPTIONS.map((option) => {
            const isSelected = theme === option.id;
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={(e) => handleSelectTheme(option.id, e)}
                className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-info/15 text-info font-semibold'
                    : 'text-ink hover:bg-surface-raised hover:text-info'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="leading-tight">{option.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {option.id === 'night' ? 'Dark theme' : option.id === 'daylight' ? 'Light warm theme' : 'High-contrast large'}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-info" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
