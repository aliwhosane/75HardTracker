// A centralized theme file for consistent styling across the app

export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  
  // Neutral palette
  background: '#F5F5F7',
  card: '#FFFFFF',
  text: '#1D1D1F',
  textSecondary: '#86868B',
  textTertiary: '#AEAEB2',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  
  // UI elements
  border: '#E5E5EA',
  divider: '#F2F2F7',
  
  // Specific elements
  completedBadge: '#E3F2FD',
  incompleteBadge: '#FFEBEE',
  progressFill: '#34C759',
  progressBackground: '#E5E5EA',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 0.34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.38,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.07,
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  pill: 9999,
};