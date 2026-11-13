import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/cn';
import type { UserTheme } from '@/types/api';

export interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabels = false }) => {
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (!showLabels) {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={`Current theme: ${theme}. Click to switch theme.`}
        title={`Current theme: ${theme}. Click to toggle.`}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-text hover:bg-surface-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20',
          className,
        )}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-purple-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </button>
    );
  }

  const themes: Array<{ value: UserTheme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Laptop className="h-4 w-4" /> },
  ];

  return (
    <div
      className={cn(
        'inline-flex rounded-xl bg-surface-2 p-1 border border-border gap-1',
        className,
      )}
    >
      {themes.map((t) => {
        const isActive = theme === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => setTheme(t.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
              isActive
                ? 'bg-surface text-text shadow-sm border border-border/80'
                : 'text-muted hover:text-text',
            )}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
