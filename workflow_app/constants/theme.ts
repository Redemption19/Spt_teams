import { Theme } from '../types';

// Brand Colors from PRD
export const BRAND_COLORS = {
  primary: '#8A0F3C', // Deep maroon
  accent: '#CF163C', // Bright crimson
  indigo: '#6366f1',
  cyan: '#22d3ee',
  orange: '#f59e42',
  rose: '#f43f5e',
  emerald: '#10b981',
};

// Light Theme
export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: BRAND_COLORS.primary,
    background: '#ffffff',
    card: '#f8fafc',
    text: '#1e293b',
    border: '#e2e8f0',
    notification: BRAND_COLORS.accent,
  },
};

// Dark Theme
export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: BRAND_COLORS.primary,
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    notification: BRAND_COLORS.accent,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Typography
export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Gradients
export const GRADIENTS = {
  primary: [BRAND_COLORS.primary, BRAND_COLORS.accent],
  card: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  background: ['#f8fafc', '#e2e8f0'],
  darkBackground: ['#0f172a', '#1e293b'],
};

// Animation
export const ANIMATION = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Layout
export const LAYOUT = {
  screenPadding: SPACING.md,
  cardPadding: SPACING.md,
  buttonHeight: 48,
  inputHeight: 48,
  borderRadius: BORDER_RADIUS.md,
};

// Status Colors
export const STATUS_COLORS = {
  success: BRAND_COLORS.emerald,
  warning: BRAND_COLORS.orange,
  error: BRAND_COLORS.rose,
  info: BRAND_COLORS.cyan,
};

// Priority Colors
export const PRIORITY_COLORS = {
  low: BRAND_COLORS.emerald,
  medium: BRAND_COLORS.orange,
  high: BRAND_COLORS.rose,
  urgent: BRAND_COLORS.accent,
};

// Task Status Colors
export const TASK_STATUS_COLORS = {
  todo: '#6b7280',
  in_progress: BRAND_COLORS.orange,
  review: BRAND_COLORS.cyan,
  done: BRAND_COLORS.emerald,
  cancelled: BRAND_COLORS.rose,
};
