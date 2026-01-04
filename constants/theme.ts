// Teller Design System - Theme Tokens

export const colors = {
  // Base backgrounds
  background: '#000',
  surface: '#1a1a1a',
  surfaceLight: '#333',
  surfaceOverlay: 'rgba(0,0,0,0.6)',

  // Text
  textPrimary: '#fff',
  textSecondary: '#888',
  textMuted: '#666',
  textInverse: '#000',

  // Brand
  primary: '#007AFF',
  primaryLight: 'rgba(0,122,255,0.2)',

  // Semantic
  error: '#FF6B6B',
  success: '#4CAF50',
  successLight: '#8BC34A',
  warning: '#FFB800',

  // Borders
  border: '#333',
  borderLight: 'rgba(255,255,255,0.2)',
  borderError: '#FF6B6B',

  // Specific UI elements
  placeholder: '#999',
  icon: '#888',
  iconActive: '#fff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 25,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
  hero: 64,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: 'bold' as const,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Light theme overrides (for future use)
export const lightColors = {
  background: '#fff',
  surface: '#f5f5f5',
  surfaceLight: '#e0e0e0',
  surfaceOverlay: 'rgba(255,255,255,0.9)',
  textPrimary: '#000',
  textSecondary: '#666',
  textMuted: '#888',
  textInverse: '#fff',
  border: '#e0e0e0',
  borderLight: 'rgba(0,0,0,0.1)',
  // Brand and semantic colors stay the same
  primary: '#007AFF',
  primaryLight: 'rgba(0,122,255,0.1)',
  error: '#FF6B6B',
  success: '#4CAF50',
  successLight: '#8BC34A',
  warning: '#FFB800',
  borderError: '#FF6B6B',
  placeholder: '#888',
  icon: '#666',
  iconActive: '#000',
};

// Common style patterns
export const commonStyles = {
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
};
