// Floating Action Button for Generate Summary
// Premium feature - always visible, drives conversion

import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@/stores/subscription';
import { useAppStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, shadow } from '@/constants/theme';
import { useEffect, useRef } from 'react';

interface FloatingActionButtonProps {
  onPressNonPremium?: () => void;
}

export function FloatingActionButton({ onPressNonPremium }: FloatingActionButtonProps) {
  const { isPremium } = useSubscriptionStore();
  const { settings } = useAppStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Subtle pulse animation to draw attention
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Glow animation (separate from pulse - non-native driver for shadow)
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  const handlePress = () => {
    // Always navigate to subscription page (branded as صفحة+)
    router.push('/subscription');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      {/* Glow wrapper - animated shadow */}
      <Animated.View
        style={[
          styles.glowWrapper,
          {
            shadowColor: colors.primary,
            shadowOpacity: glowAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'صفحة بلس' : 'Safha Plus'}
        >
          <View style={styles.buttonContent}>
            <FontAwesome name="star" size={14} color="#FFD700" />
            <Text style={styles.aiText}>{isArabic ? 'صفحة+' : 'S+'}</Text>
          </View>
          {!isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  glowWrapper: {
    borderRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    elevation: 12,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  aiText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  proBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
});
