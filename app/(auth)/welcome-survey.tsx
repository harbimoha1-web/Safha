// Welcome Survey - First-time user onboarding
// Shows value props, asks preferences, offers subscription

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme';

type SurveyStep = 'welcome' | 'frequency' | 'offer';

const FREQUENCY_OPTIONS = [
  { id: 'daily', labelAr: 'كل يوم', labelEn: 'Every day', icon: 'calendar-check-o' },
  { id: 'weekly', labelAr: 'عدة مرات أسبوعياً', labelEn: 'A few times a week', icon: 'calendar' },
  { id: 'casual', labelAr: 'عند الحاجة', labelEn: 'When I need it', icon: 'clock-o' },
];

export default function WelcomeSurveyScreen() {
  const [step, setStep] = useState<SurveyStep>('welcome');
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
  const { settings, setSurveyCompleted } = useAppStore();
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

  // Welcome step
  if (step === 'welcome') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.textPrimary }]}>صفحة</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              {isArabic ? 'أخبارك. مُلخَّصة. ذكية.' : 'Your news. Summarized. Smart.'}
            </Text>
          </View>

          <View style={styles.valueProps}>
            <View style={[styles.valueProp, { backgroundColor: colors.surface }]}>
              <View style={[styles.valueIcon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome name="magic" size={24} color={colors.primary} />
              </View>
              <View style={styles.valueText}>
                <Text style={[styles.valueTitle, { color: colors.textPrimary }]}>
                  {isArabic ? 'ملخصات ذكية' : 'Smart Summaries'}
                </Text>
                <Text style={[styles.valueDesc, { color: colors.textSecondary }]}>
                  {isArabic ? 'الذكاء الاصطناعي يلخص لك الأخبار' : 'AI summarizes news for you'}
                </Text>
              </View>
            </View>

            <View style={[styles.valueProp, { backgroundColor: colors.surface }]}>
              <View style={[styles.valueIcon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome name="clock-o" size={24} color={colors.primary} />
              </View>
              <View style={styles.valueText}>
                <Text style={[styles.valueTitle, { color: colors.textPrimary }]}>
                  {isArabic ? 'وفّر وقتك' : 'Save Time'}
                </Text>
                <Text style={[styles.valueDesc, { color: colors.textSecondary }]}>
                  {isArabic ? '5 دقائق تكفيك للمعرفة' : '5 minutes to stay informed'}
                </Text>
              </View>
            </View>

            <View style={[styles.valueProp, { backgroundColor: colors.surface }]}>
              <View style={[styles.valueIcon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome name="compass" size={24} color={colors.primary} />
              </View>
              <View style={styles.valueText}>
                <Text style={[styles.valueTitle, { color: colors.textPrimary }]}>
                  {isArabic ? 'حسب اهتماماتك' : 'Personalized'}
                </Text>
                <Text style={[styles.valueDesc, { color: colors.textSecondary }]}>
                  {isArabic ? 'أخبار تهمك أنت' : 'News that matters to you'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => setStep('frequency')}
          >
            <Text style={styles.primaryButtonText}>
              {isArabic ? 'ابدأ الآن' : "Let's Get Started"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Frequency preference step
  if (step === 'frequency') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setStep('welcome')}>
            <FontAwesome name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              {isArabic ? 'تخطي' : 'Skip'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.questionTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
            {isArabic ? 'كم مرة تريد متابعة الأخبار؟' : 'How often do you want to follow news?'}
          </Text>
          <Text style={[styles.questionSubtitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
            {isArabic ? 'نخصص تجربتك بناءً على تفضيلاتك' : "We'll personalize your experience"}
          </Text>

          <View style={styles.options}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedFrequency === option.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setSelectedFrequency(option.id)}
              >
                <FontAwesome
                  name={option.icon as any}
                  size={24}
                  color={selectedFrequency === option.id ? colors.primary : colors.textMuted}
                />
                <Text style={[
                  styles.optionText,
                  { color: colors.textPrimary },
                  selectedFrequency === option.id && { color: colors.primary },
                ]}>
                  {isArabic ? option.labelAr : option.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: selectedFrequency ? colors.primary : colors.surfaceLight },
            ]}
            onPress={() => setStep('offer')}
            disabled={!selectedFrequency}
          >
            <Text style={[styles.primaryButtonText, !selectedFrequency && { color: colors.textMuted }]}>
              {isArabic ? 'التالي' : 'Next'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Subscription offer step
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setStep('frequency')}>
          <FontAwesome name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {isArabic ? 'تخطي' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.offerCard, { backgroundColor: colors.surface }]}>
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
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#FFD700' }]}
          onPress={() => handleComplete(true)}
        >
          <Text style={[styles.primaryButtonText, { color: '#000' }]}>
            {isArabic ? 'ابدأ التجربة المجانية' : 'Start Free Trial'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => handleComplete(false)}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            {isArabic ? 'تابع مجاناً' : 'Continue for Free'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  valueProps: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
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
  questionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  questionSubtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  arabicText: {
    textAlign: 'right',
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    gap: spacing.md,
  },
  optionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  primaryButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
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
});
