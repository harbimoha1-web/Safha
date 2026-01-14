// Welcome Survey - First-time user onboarding
// Beautiful onboarding with language toggle, animations, and glass cards

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAppStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight, shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

type SurveyStep = 'welcome' | 'offer';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function WelcomeSurveyScreen() {
  const [step, setStep] = useState<SurveyStep>('welcome');
  const { settings, setSurveyCompleted, setLanguage } = useAppStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';

  const handleComplete = (showSubscription: boolean) => {
    setSurveyCompleted(true);
    if (showSubscription) {
      router.replace('/subscription');
    } else {
      router.replace('/(auth)/onboarding');
    }
  };

  const handleSkip = () => {
    setSurveyCompleted(true);
    router.replace('/(auth)/onboarding');
  };

  const toggleLanguage = () => {
    setLanguage(isArabic ? 'en' : 'ar');
  };

  // Welcome step
  if (step === 'welcome') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Language Toggle */}
        <Animated.View
          entering={FadeIn.delay(600).duration(400)}
          style={styles.langToggleContainer}
        >
          <TouchableOpacity
            style={[styles.langToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Text style={[styles.langToggleText, { color: colors.textPrimary }]}>
              {isArabic ? 'EN' : 'عربي'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600).springify()}
            style={styles.header}
          >
            <Animated.Text
              entering={FadeIn.delay(200).duration(800)}
              style={[styles.logo, { color: colors.textPrimary }]}
            >
              صفحة
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(400).duration(600)}
              style={[styles.tagline, { color: colors.textSecondary }]}
            >
              {isArabic ? 'اهتماماتك. منظمة. من مصادر موثوقة.' : 'Your interests. Organized. Trusted.'}
            </Animated.Text>
          </Animated.View>

          {/* Value Props - Glass Cards */}
          <View style={styles.valueProps}>
            <Animated.View
              entering={FadeInUp.delay(300).duration(500).springify()}
              style={[styles.valueProp, { backgroundColor: colors.surface }, shadow.sm]}
            >
              <View style={[styles.valueIcon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome name="magic" size={24} color={colors.primary} />
              </View>
              <View style={styles.valueText}>
                <Text style={[styles.valueTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
                  {isArabic ? 'ملخصات ذكية' : 'Smart Summaries'}
                </Text>
                <Text style={[styles.valueDesc, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
                  {isArabic ? 'الذكاء الاصطناعي يلخص كل ما تتابعه' : 'AI summarizes everything you follow'}
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(400).duration(500).springify()}
              style={[styles.valueProp, { backgroundColor: colors.surface }, shadow.sm]}
            >
              <View style={[styles.valueIcon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome name="shield" size={24} color={colors.primary} />
              </View>
              <View style={styles.valueText}>
                <Text style={[styles.valueTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
                  {isArabic ? 'مصادر موثوقة' : 'Trusted Sources'}
                </Text>
                <Text style={[styles.valueDesc, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
                  {isArabic ? 'محتوى مميز فقط، بدون ضوضاء' : 'Only quality content, no noise'}
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(500).duration(500).springify()}
              style={[styles.valueProp, { backgroundColor: colors.surface }, shadow.sm]}
            >
              <View style={[styles.valueIcon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome name="compass" size={24} color={colors.primary} />
              </View>
              <View style={styles.valueText}>
                <Text style={[styles.valueTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
                  {isArabic ? 'أكثر من أخبار' : 'Beyond News'}
                </Text>
                <Text style={[styles.valueDesc, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
                  {isArabic ? 'تقنية، رياضة، أسلوب حياة، والمزيد' : 'Tech, sports, lifestyle, and more'}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* CTA Button */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, shadow.md]}
              onPress={() => setStep('offer')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isArabic ? 'ابدأ الآن' : "Let's Get Started"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Step Indicator */}
          <Animated.View
            entering={FadeIn.delay(700).duration(400)}
            style={styles.stepIndicator}
          >
            <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: colors.primary }]} />
            <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Subscription offer step
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.stepHeader}
      >
        <TouchableOpacity onPress={() => setStep('welcome')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesome name={isArabic ? "arrow-right" : "arrow-left"} size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {isArabic ? 'تخطي' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInUp.delay(100).duration(500).springify()}
          style={[styles.offerCard, { backgroundColor: colors.surface }, shadow.lg]}
        >
          <View style={styles.offerBadge}>
            <FontAwesome name="star" size={20} color="#FFD700" />
            <Text style={[styles.offerBadgeText, { color: colors.textPrimary }]}>صفحة+</Text>
          </View>

          <Text style={[styles.offerTitle, { color: colors.textPrimary }]}>
            {isArabic ? 'جرّب مجاناً لمدة 30 يوم' : 'Try Free for 30 Days'}
          </Text>

          <View style={styles.offerFeatures}>
            <View style={styles.offerFeature}>
              <FontAwesome name="check" size={16} color={colors.success} />
              <Text style={[styles.offerFeatureText, { color: colors.textSecondary }]}>
                {isArabic ? 'ملخصات يومية مخصصة' : 'Personalized daily summaries'}
              </Text>
            </View>
            <View style={styles.offerFeature}>
              <FontAwesome name="check" size={16} color={colors.success} />
              <Text style={[styles.offerFeatureText, { color: colors.textSecondary }]}>
                {isArabic ? 'ملخص أسبوعي على واتساب' : 'Weekly WhatsApp digest'}
              </Text>
            </View>
            <View style={styles.offerFeature}>
              <FontAwesome name="check" size={16} color={colors.success} />
              <Text style={[styles.offerFeatureText, { color: colors.textSecondary }]}>
                {isArabic ? 'بدون إعلانات' : 'Ad-free experience'}
              </Text>
            </View>
          </View>

          <Text style={[styles.offerPrice, { color: colors.textMuted }]}>
            {isArabic ? 'ثم 16 ريال/شهر فقط' : 'Then only SAR 16/month'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <TouchableOpacity
            style={[styles.primaryButton, styles.goldButton, shadow.md]}
            onPress={() => handleComplete(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: '#000' }]}>
              {isArabic ? 'ابدأ التجربة المجانية' : 'Start Free Trial'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => handleComplete(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              {isArabic ? 'تخطي' : 'Skip'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Step Indicator */}
        <Animated.View
          entering={FadeIn.delay(500).duration(400)}
          style={styles.stepIndicator}
        >
          <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
          <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: colors.primary }]} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  langToggleContainer: {
    position: 'absolute',
    top: 60,
    right: spacing.xl,
    zIndex: 10,
  },
  langToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  langToggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: 56,
    fontWeight: fontWeight.bold,
  },
  tagline: {
    fontSize: fontSize.lg,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  valueProps: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    flex: 1,
  },
  valueTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  valueDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  arabicText: {
    textAlign: 'right',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: fontSize.md,
  },
  primaryButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  goldButton: {
    backgroundColor: '#FFD700',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  secondaryButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  offerCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  offerBadgeText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  offerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  offerFeatures: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  offerFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  offerFeatureText: {
    fontSize: fontSize.md,
  },
  offerPrice: {
    fontSize: fontSize.sm,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    width: 24,
    borderRadius: 4,
  },
});
