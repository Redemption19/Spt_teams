'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'button' | 'icon';
  size?: 'sm' | 'default' | 'lg';
}

export function ThemeToggle({ variant = 'icon', size = 'default' }: ThemeToggleProps) {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return actualTheme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System';
    }
    return actualTheme === 'light' ? 'Light' : 'Dark';
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={toggleTheme}
        className="gap-2"
      >
        {getIcon()}
        {getLabel()}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      title={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
