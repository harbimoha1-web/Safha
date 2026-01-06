// Safha Design System - Theme Tokens

export const colors = {
  // Base backgrounds
  background: '#000',
  surface: '#1a1a1a',
  surfaceLight: '#333',
  surfaceOverlay: 'rgba(0,0,0,0.6)',

  // Text (WCAG AA compliant)
  textPrimary: '#fff',
  textSecondary: '#999', // 4.5:1 contrast ratio on #000
  textMuted: '#888', // 5.3:1 contrast ratio on #000
  textInverse: '#000',

  // Brand
  primary: '#007AFF',
  primaryLight: 'rgba(0,122,255,0.2)',

  // Semantic (WCAG AA compliant)
  error: '#FF6B6B',
  success: '#4CAF50',
  successLight: '#8BC34A',
  warning: '#E6A700', // Darkened from #FFB800 for better contrast
  warningDark: '#996E00', // For text on light backgrounds

  // Premium/Subscription
  premium: '#FFD700', // Gold color for premium features

  // Brand colors
  whatsapp: '#25D366', // WhatsApp brand green

  // Borders
  border: '#333',
  borderLight: 'rgba(255,255,255,0.2)',
  borderError: '#FF6B6B',

  // Specific UI elements (WCAG AA compliant)
  placeholder: '#aaa', // 4.2:1 on #1a1a1a - acceptable for placeholder
  icon: '#999', // 4.5:1 contrast
  iconActive: '#fff',

  // Utility colors
  white: '#fff',
  black: '#000',

  // Button-specific colors (always white on primary buttons)
  buttonPrimaryText: '#fff',

  // Overlay colors for headers/gradients
  headerOverlay: 'rgba(0,0,0,0.75)',
  cardGradient: ['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)'] as [string, string, string],
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

// Font families
export const fontFamily = {
  // Default (system font)
  regular: undefined as string | undefined,
  medium: undefined as string | undefined,
  bold: undefined as string | undefined,
  // Arabic (Tajawal)
  arabicRegular: 'Tajawal-Regular',
  arabicMedium: 'Tajawal-Medium',
  arabicBold: 'Tajawal-Bold',
};

// Line height multipliers
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.6,
  arabic: 1.75, // Taller for Arabic diacritical marks
};

// Centralized Arabic text styles
export const arabicTextStyle = {
  fontFamily: fontFamily.arabicRegular,
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
  letterSpacing: 0, // No letter spacing for Arabic
};

export const arabicTextStyleMedium = {
  ...arabicTextStyle,
  fontFamily: fontFamily.arabicMedium,
};

export const arabicTextStyleBold = {
  ...arabicTextStyle,
  fontFamily: fontFamily.arabicBold,
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

// Premium subscription colors (dark mode)
export const premiumColors = {
  // Gradients
  heroGradient: ['#000000', '#0A0A1A', '#1A0A2A'] as [string, string, string],
  ctaGradient: ['#007AFF', '#0056B3'] as [string, string],
  goldGradient: ['#FFD700', '#FFA500'] as [string, string],
  purpleGradient: ['#A855F7', '#7C3AED'] as [string, string],

  // Glows
  primaryGlow: 'rgba(0, 122, 255, 0.3)',
  goldGlow: 'rgba(255, 215, 0, 0.3)',
  purpleGlow: 'rgba(168, 85, 247, 0.3)',

  // Glass-morphism
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Shimmer
  shimmerHighlight: 'rgba(255, 255, 255, 0.3)',

  // Confetti colors
  confetti: ['#FFD700', '#007AFF', '#A855F7', '#4CAF50', '#FF6B6B'],
};

// Premium subscription colors (light mode)
export const lightPremiumColors = {
  // Warm cream/gold gradient for premium feel
  heroGradient: ['#FFFBF0', '#FFF5E1', '#FFEFD5'] as [string, string, string],
  ctaGradient: ['#007AFF', '#0056B3'] as [string, string],
  goldGradient: ['#FFD700', '#FFA500'] as [string, string],
  purpleGradient: ['#A855F7', '#7C3AED'] as [string, string],

  // Subtle glass for light mode visibility
  glassBackground: 'rgba(0, 0, 0, 0.03)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',

  // Glows (subtle on light)
  primaryGlow: 'rgba(0, 122, 255, 0.15)',
  goldGlow: 'rgba(255, 215, 0, 0.25)',
  purpleGlow: 'rgba(168, 85, 247, 0.15)',

  // Shimmer (darker for light mode)
  shimmerHighlight: 'rgba(0, 0, 0, 0.06)',

  // Confetti colors (same)
  confetti: ['#FFD700', '#007AFF', '#A855F7', '#4CAF50', '#FF6B6B'],
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
  warningDark: '#996E00',
  premium: '#DAA520', // Darker gold for light mode visibility
  whatsapp: '#128C7E', // Darker WhatsApp green for light mode visibility
  borderError: '#FF6B6B',
  placeholder: '#888',
  icon: '#666',
  iconActive: '#000',

  // Utility colors
  white: '#fff',
  black: '#000',

  // Button-specific colors (always white on primary buttons)
  buttonPrimaryText: '#fff',

  // Overlay colors for headers/gradients (light mode uses light overlay)
  headerOverlay: 'rgba(255,255,255,0.95)',
  cardGradient: ['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)'] as [string, string, string],
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
    color: colors.buttonPrimaryText,
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
