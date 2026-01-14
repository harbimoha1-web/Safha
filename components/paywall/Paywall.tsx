// Paywall Component
// Displays upgrade prompt for premium features

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/moyasar';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import type { IconName } from '@/types';

interface PaywallProps {
  feature: string;
  featureAr: string;
  onClose?: () => void;
}

export function Paywall({ feature, featureAr, onClose }: PaywallProps) {
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  const plan = SUBSCRIPTION_PLANS.premium;

  const handleUpgrade = () => {
    router.push('/subscription');
    onClose?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <FontAwesome name="star" size={40} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, isArabic && styles.arabicText]}>
          {isArabic ? 'ميزة بريميوم' : 'Premium Feature'}
        </Text>

        {/* Feature description */}
        <Text style={[styles.featureText, isArabic && styles.arabicText]}>
          {isArabic ? featureAr : feature}
        </Text>

        {/* Benefits */}
        <View style={styles.benefits}>
          <BenefitItem
            icon="check"
            text={isArabic ? 'كل المواضيع التي تهمك' : 'All topics you care about'}
            isArabic={isArabic}
          />
          <BenefitItem
            icon="check"
            text={isArabic ? 'مصادر موثوقة فقط' : 'Trusted sources only'}
            isArabic={isArabic}
          />
          <BenefitItem
            icon="check"
            text={isArabic ? 'ملخص يومي مخصص' : 'Personalized daily digest'}
            isArabic={isArabic}
          />
          <BenefitItem
            icon="check"
            text={isArabic ? 'تجربة بدون إعلانات' : 'Ad-free experience'}
            isArabic={isArabic}
          />
        </View>

        {/* Price */}
        <Text style={[styles.price, isArabic && styles.arabicText]}>
          {isArabic ? plan.priceDisplayAr : plan.priceDisplay}
        </Text>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgrade}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'ترقية الآن' : 'Upgrade now'}
        >
          <Text style={styles.upgradeButtonText}>
            {isArabic ? 'ترقية الآن' : 'Upgrade Now'}
          </Text>
        </TouchableOpacity>

        {/* Close button */}
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
          >
            <Text style={styles.closeButtonText}>
              {isArabic ? 'ليس الآن' : 'Not now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function BenefitItem({
  icon,
  text,
  isArabic,
}: {
  icon: IconName;
  text: string;
  isArabic: boolean;
}) {
  return (
    <View style={[styles.benefitItem, isArabic && styles.benefitItemRtl]}>
      <FontAwesome name={icon} size={16} color={colors.success} />
      <Text style={[styles.benefitText, isArabic && styles.arabicText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  benefits: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  benefitItemRtl: {
    flexDirection: 'row-reverse',
  },
  benefitText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  arabicText: {
    textAlign: 'right',
  },
});
