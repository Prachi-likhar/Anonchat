export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#7C3AED',
      light: '#8B5CF6',
      dark: '#6D28D9',
    },
    background: {
      light: '#F7F7FB',
      dark: '#0E0F1A',
    },
    surface: {
      light: '#FFFFFF',
      dark: '#161827',
    },
    surface2: {
      light: '#F0F1F7',
      dark: '#1E2033',
    },
    border: {
      light: '#E4E6F0',
      dark: '#2A2D45',
    },
    content: {
      light: '#12131F',
      dark: '#ECEDF7',
    },
    muted: {
      light: '#6B6F8A',
      dark: '#8E92B0',
    },
    online: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
  },
  gradients: {
    primary: ['#7C3AED', '#EC4899'] as const,
    surfaceDark: ['#161827', '#0E0F1A'] as const,
    surfaceLight: ['#FFFFFF', '#F7F7FB'] as const,
  },
  avatarColors: [
    '#7C3AED', // violet
    '#EC4899', // pink
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // purple
    '#EF4444', // red
    '#06B6D4', // cyan
    '#F97316', // orange
    '#14B8A6', // teal
    '#6366F1', // indigo
    '#84CC16', // lime
  ],
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
} as const;

export type ThemeMode = 'system' | 'light' | 'dark';
