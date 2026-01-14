// OptimizedImage - Reusable image component with optimization and fallbacks
// Ensures 0% image failure rate with graceful degradation

import { useState, useCallback } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  StyleSheet,
  ImageProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getOptimizedImageUrl } from '@/lib/image';
import { useTheme } from '@/contexts/ThemeContext';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  url: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  fallbackIcon?: string;
  fallbackIconSize?: number;
  width?: number;
  height?: number;
  showFallbackBackground?: boolean;
}

export function OptimizedImage({
  url,
  style,
  fallbackIcon = 'image',
  fallbackIconSize = 32,
  width,
  height,
  showFallbackBackground = true,
  ...imageProps
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [useOriginalUrl, setUseOriginalUrl] = useState(false);
  const { colors } = useTheme();

  // Get optimized URL
  const optimizedUrl = url ? getOptimizedImageUrl(url, width, height) : null;
  const displayUrl = useOriginalUrl ? url : (optimizedUrl || url);

  const handleError = useCallback(() => {
    if (!useOriginalUrl && url) {
      // First failure: optimized URL failed, try original
      console.warn('[Image] Optimized URL failed, trying original:', url?.substring(0, 80));
      setUseOriginalUrl(true);
    } else {
      // Both failed, show fallback
      console.warn('[Image] Both URLs failed, showing fallback:', url?.substring(0, 80));
      setHasError(true);
    }
  }, [useOriginalUrl, url]);

  // No URL provided or both URLs failed - show fallback
  if (!url || hasError) {
    if (!showFallbackBackground) {
      return null;
    }
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surface }, style]}>
        <FontAwesome
          name={fallbackIcon as any}
          size={fallbackIconSize}
          color={colors.textMuted}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: displayUrl! }}
      style={style}
      onError={handleError}
      {...imageProps}
    />
  );
}

// ImageBackground variant for cards with overlay content
import { ImageBackground, ImageBackgroundProps } from 'react-native';

interface OptimizedImageBackgroundProps extends Omit<ImageBackgroundProps, 'source'> {
  url: string | null | undefined;
  width?: number;
  height?: number;
  fallbackIcon?: string;
  fallbackIconSize?: number;
}

export function OptimizedImageBackground({
  url,
  style,
  children,
  width,
  height,
  fallbackIcon = 'image',
  fallbackIconSize = 48,
  ...imageProps
}: OptimizedImageBackgroundProps) {
  const [hasError, setHasError] = useState(false);
  const [useOriginalUrl, setUseOriginalUrl] = useState(false);
  const { colors } = useTheme();

  // Get optimized URL
  const optimizedUrl = url ? getOptimizedImageUrl(url, width, height) : null;
  const displayUrl = useOriginalUrl ? url : (optimizedUrl || url);

  const handleError = useCallback(() => {
    if (!useOriginalUrl && url) {
      console.warn('[ImageBg] Optimized URL failed, trying original:', url?.substring(0, 80));
      setUseOriginalUrl(true);
    } else {
      console.warn('[ImageBg] Both URLs failed, showing fallback:', url?.substring(0, 80));
      setHasError(true);
    }
  }, [useOriginalUrl, url]);

  // No URL or both URLs failed - show fallback background
  if (!url || hasError) {
    return (
      <View style={[styles.fallbackBackground, { backgroundColor: colors.surface }, style]}>
        <FontAwesome
          name={fallbackIcon as any}
          size={fallbackIconSize}
          color={colors.textMuted}
          style={styles.fallbackBackgroundIcon}
        />
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: displayUrl! }}
      style={style}
      onError={handleError}
      {...imageProps}
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackBackground: {
    justifyContent: 'flex-end',
  },
  fallbackBackgroundIcon: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    opacity: 0.3,
  },
});
