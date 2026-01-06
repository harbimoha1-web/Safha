// Subscription Screen - Maximum WOW Edition
// Premium upgrade flow with stunning animations

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAppStore, useSubscriptionStore, useAuthStore } from '@/stores';
import { SUBSCRIPTION_PLANS, type PlanType } from '@/lib/payments/moyasar';
import { HapticFeedback } from '@/lib/haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { premiumColors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

// WOW Components
import {
  AnimatedHero,
  AnimatedValueItem,
  AnimatedPlanCard,
  ShimmerButton,
  FloatingParticles,
  PremiumCelebration,
} from '@/components/subscription';

// Value stack items
const VALUE_ITEMS = [
  { icon: 'magic', textEn: 'Your news, summarized daily', textAr: 'أخبارك ملخصة كل يوم', value: 20 },
  { icon: 'whatsapp', textEn: 'Weekly digest to WhatsApp', textAr: 'ملخص أسبوعي على واتسابك', value: 10 },
  { icon: 'ban', textEn: 'Zero ads. Pure news.', textAr: 'بدون إعلانات. أخبار فقط.', value: 10 },
  { icon: 'bolt', textEn: 'AI learns what you care about', textAr: 'الذكاء الاصطناعي يتعلم اهتماماتك', value: 10 },
];

export default function SubscriptionScreen() {
  const { settings } = useAppStore();
  const { subscription, isPremium, initiatePayment, confirmPayment, subscribe } = useSubscriptionStore();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';
  const params = useLocalSearchParams<{ status?: string }>();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
  const [isLoading, setIsLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animation values - start at 1 (fully visible) for instant display
  const trialBannerAnim = useRef(new Animated.Value(1)).current;
  const valueStackAnim = useRef(new Animated.Value(1)).current;
  const planCardsAnim = useRef(new Animated.Value(1)).current;
  const ctaAnim = useRef(new Animated.Value(1)).current;
  const secondaryAnim = useRef(new Animated.Value(1)).current;

  // Handle payment callback (when user returns from Moyasar)
  useEffect(() => {
    if (params.status === 'success') {
      // User returned from successful payment
      confirmPayment().then(() => {
        setShowCelebration(true);
      });
    } else if (params.status === 'failed') {
      Alert.alert(
        isArabic ? 'فشل الدفع' : 'Payment Failed',
        isArabic
          ? 'لم تتم عملية الدفع. حاول مرة أخرى.'
          : 'Payment was not completed. Please try again.'
      );
    }
  }, [params.status]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    HapticFeedback.buttonPress();

    // Check if user is logged in - redirect to login with returnTo
    if (!user) {
      setIsLoading(false);
      router.push({
        pathname: '/(auth)/login',
        params: { returnTo: '/subscription' }
      });
      return;
    }

    try {
      // Initiate payment flow
      const result = await initiatePayment(selectedPlan);

      if (!result.success) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      if (result.paymentUrl) {
        // Production: Open Moyasar payment page in browser
        const browserResult = await WebBrowser.openBrowserAsync(result.paymentUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          dismissButtonStyle: 'cancel',
        });

        // When browser closes, check if payment was completed
        if (browserResult.type === 'cancel') {
          // User cancelled - show message
          Alert.alert(
            isArabic ? 'تم الإلغاء' : 'Cancelled',
            isArabic
              ? 'تم إلغاء عملية الدفع.'
              : 'Payment was cancelled.'
          );
        } else {
          // Browser closed - refresh subscription status
          await confirmPayment();
          // If now premium, show celebration
          const { isPremium: nowPremium } = useSubscriptionStore.getState();
          if (nowPremium) {
            setShowCelebration(true);
          }
        }
      } else {
        // Demo mode: No payment URL means activate directly
        await subscribe(selectedPlan);
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        isArabic ? 'خطأ' : 'Error',
        isArabic
          ? 'حدث خطأ أثناء الاشتراك. حاول مرة أخرى.'
          : 'An error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    router.back();
  };

  // Premium status screen with celebration
  if (isPremium && !showCelebration) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <FloatingParticles />
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
          >
            <FontAwesome name="times" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.premiumStatus}>
          <View style={[styles.premiumIconContainer, { shadowColor: colors.primary }]}>
            <FontAwesome name="diamond" size={60} color={colors.primary} />
          </View>
          <Text style={[styles.premiumTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
            {isArabic ? 'أنت عضو مميز!' : "You're Premium!"}
          </Text>
          <Text style={[styles.premiumSubtitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
            {isArabic
              ? 'تستمتع بجميع المميزات الحصرية'
              : 'Enjoying all exclusive features'}
          </Text>
          {subscription && subscription.currentPeriodEnd && (
            <Text style={[styles.renewalDate, { color: colors.primary }]}>
              {isArabic ? 'التجديد: ' : 'Renews: '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const trialBannerTranslate = trialBannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const ctaTranslate = ctaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating particles background */}
      <FloatingParticles />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
        >
          <FontAwesome name="times" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {isArabic ? 'صفحة بلس' : 'Safha Plus'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Trial Banner */}
        <Animated.View
          style={[
            styles.trialBanner,
            {
              opacity: trialBannerAnim,
              transform: [{ translateY: trialBannerTranslate }],
              backgroundColor: colors.success,
              shadowColor: colors.success,
            },
          ]}
        >
          <FontAwesome name="gift" size={20} color="#fff" />
          <Text style={styles.trialBannerText}>
            {isArabic ? '30 يوم مجاناً • شهر كامل!' : '30 Days Free • Full Month!'}
          </Text>
        </Animated.View>

        {/* Animated Hero */}
        <AnimatedHero isArabic={isArabic} />

        {/* Animated Value Stack */}
        <Animated.View style={[styles.valueStack, { opacity: valueStackAnim }]}>
          <Text style={[styles.valueStackTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
            {isArabic ? 'يتضمن الاشتراك:' : "What's included:"}
          </Text>

          {VALUE_ITEMS.map((item, index) => (
            <AnimatedValueItem
              key={item.icon}
              icon={item.icon}
              text={isArabic ? item.textAr : item.textEn}
              value={isArabic ? `${item.value} ريال` : `SAR ${item.value}`}
              index={index}
              isArabic={isArabic}
              startAnimation={true}
            />
          ))}

          {/* Total Value */}
          <View style={styles.totalValueContainer}>
            <View style={styles.totalValueRow}>
              <Text style={[styles.totalValueLabel, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
                {isArabic ? 'القيمة الإجمالية:' : 'Total Value:'}
              </Text>
              <Text style={[styles.totalValueStrike, { color: colors.textMuted }]}>
                {isArabic ? '50 ريال/شهر' : 'SAR 50/month'}
              </Text>
            </View>
            <View style={[styles.yourPriceRow, isArabic && styles.yourPriceRowRtl]}>
              <Text style={[styles.yourPriceLabel, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
                {isArabic ? 'سعرك:' : 'Your Price:'}
              </Text>
              <View style={[styles.priceWithBadge, isArabic && styles.priceWithBadgeRtl]}>
                <View style={[styles.savingsBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.savingsText}>
                    {isArabic ? 'وفر 68%' : '68% OFF'}
                  </Text>
                </View>
                <Text style={[styles.yourPrice, { color: colors.success }]}>
                  {isArabic ? '16 ريال/شهر' : 'SAR 16/month'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Animated Plan Cards */}
        <Animated.View
          style={[
            styles.plans,
            {
              opacity: planCardsAnim,
              transform: [{ scale: planCardsAnim }],
            },
          ]}
        >
          <AnimatedPlanCard
            plan="premium"
            title={isArabic ? 'شهري' : 'Monthly'}
            price={isArabic ? SUBSCRIPTION_PLANS.premium.priceDisplayAr : SUBSCRIPTION_PLANS.premium.priceDisplay}
            isSelected={selectedPlan === 'premium'}
            onSelect={() => setSelectedPlan('premium')}
            isArabic={isArabic}
          />
          <AnimatedPlanCard
            plan="premium_annual"
            title={isArabic ? 'سنوي' : 'Annual'}
            price={isArabic ? SUBSCRIPTION_PLANS.premium_annual.priceDisplayAr : SUBSCRIPTION_PLANS.premium_annual.priceDisplay}
            badge={isArabic ? 'وفر 22%' : 'Save 22%'}
            isSelected={selectedPlan === 'premium_annual'}
            onSelect={() => setSelectedPlan('premium_annual')}
            isArabic={isArabic}
            isAnnual
          />
        </Animated.View>

        {/* Payment Methods */}
        <Animated.View style={[styles.paymentMethods, { opacity: secondaryAnim }]}>
          <Text style={[styles.paymentLabel, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
            {isArabic ? 'طرق الدفع المتاحة' : 'Available payment methods'}
          </Text>
          <View style={styles.paymentIcons}>
            <View style={[styles.paymentIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.paymentText, { color: colors.textPrimary }]}>mada</Text>
            </View>
            <View style={[styles.paymentIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FontAwesome name="apple" size={20} color={colors.textPrimary} />
            </View>
            <View style={[styles.paymentIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.paymentText, { color: colors.textPrimary }]}>STC</Text>
            </View>
          </View>
        </Animated.View>

        {/* Money-Back Guarantee */}
        <Animated.View style={[styles.guaranteeBanner, { opacity: secondaryAnim, borderColor: colors.success }]}>
          <FontAwesome name="shield" size={16} color={colors.success} />
          <Text style={[styles.guaranteeText, { color: colors.success }, isArabic && styles.arabicText]}>
            {isArabic
              ? 'ضمان استرداد المال خلال 30 يوم - بدون أسئلة'
              : '30-Day Money-Back Guarantee - No Questions Asked'}
          </Text>
        </Animated.View>

        {/* Shimmer CTA Button */}
        <Animated.View
          style={{
            opacity: ctaAnim,
            transform: [{ translateY: ctaTranslate }],
          }}
        >
          <ShimmerButton
            text={isArabic ? 'ابدأ مجاناً لمدة ٣٠ يوم' : 'Start Free for 30 Days'}
            subtext={
              isArabic
                ? `ثم ${selectedPlan === 'premium' ? '16 ريال/شهر' : '150 ريال/سنة'} • إلغاء في أي وقت`
                : `Then ${selectedPlan === 'premium' ? 'SAR 16/month' : 'SAR 150/year'} • Cancel anytime`
            }
            onPress={handleSubscribe}
            isLoading={isLoading}
            isArabic={isArabic}
          />
        </Animated.View>

        {/* Urgency Banner */}
        <Animated.View style={[styles.urgencyBanner, { opacity: secondaryAnim }]}>
          <FontAwesome name="rocket" size={14} color={colors.primary} />
          <Text style={[styles.urgencyText, { color: colors.primary }]}>
            {isArabic
              ? 'ابدأ الآن واستمتع بالذكاء الاصطناعي والمزايا الحصرية'
              : 'Start now and enjoy AI features and exclusive benefits'}
          </Text>
        </Animated.View>

        {/* Terms */}
        <Animated.View style={{ opacity: secondaryAnim }}>
          <Text style={[styles.terms, { color: colors.textMuted }]}>
            {isArabic
              ? 'بالاشتراك، أنت توافق على شروط الاستخدام وسياسة الخصوصية. يمكنك إلغاء الاشتراك في أي وقت قبل انتهاء الفترة التجريبية.'
              : 'By subscribing, you agree to our Terms of Service and Privacy Policy. Cancel anytime before trial ends.'}
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Premium Celebration Modal */}
      <PremiumCelebration
        visible={showCelebration}
        onClose={handleCelebrationClose}
        isArabic={isArabic}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trialBannerText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  valueStack: {
    backgroundColor: premiumColors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: premiumColors.glassBorder,
  },
  valueStackTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  totalValueContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: premiumColors.glassBorder,
  },
  totalValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalValueLabel: {
    fontSize: fontSize.md,
  },
  totalValueStrike: {
    fontSize: fontSize.lg,
    textDecorationLine: 'line-through',
  },
  yourPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourPriceLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  priceWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  yourPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  savingsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  savingsText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  guaranteeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  urgencyText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  plans: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  paymentMethods: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  paymentLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  paymentIcon: {
    width: 60,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  paymentText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  terms: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  premiumIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
  },
  premiumSubtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  renewalDate: {
    fontSize: fontSize.sm,
    marginTop: spacing.lg,
  },
  arabicText: {
    textAlign: 'right',
  },
  yourPriceRowRtl: {
    flexDirection: 'row-reverse',
  },
  priceWithBadgeRtl: {
    flexDirection: 'row-reverse',
  },
});
