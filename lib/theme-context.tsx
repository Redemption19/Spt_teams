'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type BrandColors = {
  primary: string; // hex, e.g. #8A0F3C
  accent: string; // hex
  secondary: string; // hex
};

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  brandColors: BrandColors;
  setBrandColors: (colors: Partial<BrandColors>) => void;
  resetBrandColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [brandColors, setBrandColorsState] = useState<BrandColors>({
    primary: '#8A0F3C',
    accent: '#CF163C',
    secondary: '#E5E7EB',
  });

  // Convert hex like #RRGGBB to "H S% L%" string expected by Tailwind hsl(var(--x))
  const hexToHslString = (hex: string): string => {
    let clean = hex.trim();
    if (clean.startsWith('#')) clean = clean.slice(1);
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    const H = Math.round(h * 360);
    const S = Math.round(s * 100);
    const L = Math.round(l * 100);
    return `${H} ${S}% ${L}%`;
  };

  const applyBrandColors = (colors: BrandColors) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.style.setProperty('--primary', hexToHslString(colors.primary));
    root.style.setProperty('--accent', hexToHslString(colors.accent));
    root.style.setProperty('--secondary', hexToHslString(colors.secondary));
    // Ensure focus rings follow primary
    root.style.setProperty('--ring', hexToHslString(colors.primary));
  };

  // Function to get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Function to apply theme to document
  const applyTheme = (theme: 'light' | 'dark') => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      setActualTheme(theme);
    }
  };

  // Function to set theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      
      if (newTheme === 'system') {
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);
      } else {
        applyTheme(newTheme);
      }
    }
  };

  // Function to toggle between light and dark (skips system)
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      // If system, toggle to opposite of current actual theme
      setTheme(actualTheme === 'light' ? 'dark' : 'light');
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      const initialTheme = savedTheme || 'system';
      
      if (initialTheme === 'system') {
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);
      } else {
        applyTheme(initialTheme);
      }
      
      setThemeState(initialTheme);
      // Load and apply saved brand colors if any
      try {
        const saved = localStorage.getItem('brandColors');
        if (saved) {
          const parsed = JSON.parse(saved) as BrandColors;
          setBrandColorsState(parsed);
          applyBrandColors(parsed);
        } else {
          applyBrandColors(brandColors);
        }
      } catch {
        applyBrandColors(brandColors);
      }
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const systemTheme = getSystemTheme();
        applyTheme(systemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setBrandColors = (partial: Partial<BrandColors>) => {
    setBrandColorsState((prev) => {
      const next = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('brandColors', JSON.stringify(next));
        applyBrandColors(next);
      }
      return next;
    });
  };

  const resetBrandColors = () => {
    const defaults: BrandColors = {
      primary: '#8A0F3C',
      accent: '#CF163C',
      secondary: '#E5E7EB',
    };
    setBrandColorsState(defaults);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brandColors');
      applyBrandColors(defaults);
    }
  };

  const value = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
    brandColors,
    setBrandColors,
    resetBrandColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
