// Smart Paywall Modal
// Shows contextual upgrade prompts based on user behavior

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { HapticFeedback } from '@/lib/haptics';
import { type PaywallTrigger, getPaywallMessage } from '@/lib/paywall';

const { width } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  trigger?: PaywallTrigger;
  streakDays?: number;
}

export function PaywallModal({
  visible,
  onClose,
  trigger = 'default',
  streakDays,
}: PaywallModalProps) {
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';
  const message = getPaywallMessage(trigger, isArabic, streakDays);

  const handleUpgrade = () => {
    HapticFeedback.buttonPress();
    onClose();
    router.push('/subscription');
  };

  const handleDismiss = () => {
    HapticFeedback.buttonPress();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome name="times" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <FontAwesome name="star" size={40} color={colors.primary} />
          </View>

          {/* Message */}
          <Text style={[styles.title, isArabic && styles.arabicText]}>
            {message.title}
          </Text>
          <Text style={[styles.subtitle, isArabic && styles.arabicText]}>
            {message.subtitle}
          </Text>

          {/* Trial badge */}
          <View style={styles.trialBadge}>
            <FontAwesome name="gift" size={14} color="#fff" />
            <Text style={styles.trialBadgeText}>
              {isArabic ? '7 أيام مجانية' : '7 Days Free'}
            </Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>
              {isArabic ? 'ابدأ التجربة المجانية' : 'Start Free Trial'}
            </Text>
          </TouchableOpacity>

          {/* Secondary action */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDismiss}
          >
            <Text style={styles.secondaryButtonText}>
              {isArabic ? 'لاحقاً' : 'Maybe Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: width - spacing.xxl * 2,
    maxWidth: 360,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  arabicText: {
    textAlign: 'center',
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  trialBadgeText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
});
