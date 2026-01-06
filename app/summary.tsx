// Daily Summary Screen (Premium Feature)
// Premium luxury experience with glassmorphism, gradients, and staggered animations

import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  Animated,
  Easing,
  AccessibilityInfo,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAppStore } from '@/stores';
import { useSummaryStore } from '@/stores/summary';
import { getDailySummaryStories } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '@/constants/theme';
import { HapticFeedback } from '@/lib/haptics';
import {
  SummaryHero,
  TopicSectionCard,
  SourcesFooter,
  SummaryLoadingSkeleton,
} from '@/components/summary';

// Shimmer animation timing
const SHIMMER_DURATION = 2000;

export default function SummaryScreen() {
  const { settings } = useAppStore();
  const { summary, isLoading, error, generateSummary, clearSummary, setLoading } = useSummaryStore();
  const { colors, premiumColors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Shimmer animation for regenerate button
  const shimmerPosition = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [buttonWidth, setButtonWidth] = useState(300);
  const reduceMotionRef = useRef(false);

  const isArabic = settings.language === 'ar';

  useEffect(() => {
    loadSummary();
    return () => clearSummary();
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      reduceMotionRef.current = reduceMotion;
      if (reduceMotion) return;

      // Continuous shimmer animation for regenerate button
      const shimmer = Animated.loop(
        Animated.timing(shimmerPosition, {
          toValue: 1,
          duration: SHIMMER_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      shimmer.start();

      return () => shimmer.stop();
    });
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const stories = await getDailySummaryStories(undefined, 5);
      generateSummary(stories, settings.language);
    } catch (err) {
      console.error('Failed to load summary:', err);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!summary) return;
    HapticFeedback.shareStory();
    try {
      let shareText = isArabic ? 'ملخصي اليومي من صفحة\n\n' : 'My Daily Digest from Safha\n\n';

      summary.sections.forEach((section) => {
        shareText += `📌 ${isArabic ? section.topicAr : section.topic}\n`;
        section.stories.forEach((story) => {
          shareText += `• ${isArabic ? story.titleAr : story.title}\n`;
        });
        shareText += '\n';
      });

      await Share.share({ message: shareText });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleButtonLayout = (event: LayoutChangeEvent) => {
    setButtonWidth(event.nativeEvent.layout.width);
  };

  const handleRegeneratePressIn = () => {
    if (reduceMotionRef.current) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleRegeneratePressOut = () => {
    if (reduceMotionRef.current) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleRegenerate = () => {
    HapticFeedback.buttonPress();
    handleRefresh();
  };

  const shimmerTranslate = shimmerPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-buttonWidth, buttonWidth * 2],
  });

  // Loading state - Premium skeleton
  if (isLoading && !summary) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={premiumColors.heroGradient}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: premiumColors.glassBackground, borderColor: premiumColors.glassBorder }]}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
          >
            <FontAwesome
              name={isArabic ? 'arrow-right' : 'arrow-left'}
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
              {isArabic ? 'ملخصك اليومي' : 'Your Daily Digest'}
            </Text>
          </View>
          <View style={[styles.shareButton, { backgroundColor: premiumColors.glassBackground, borderColor: premiumColors.glassBorder }]} />
        </View>
        <SummaryLoadingSkeleton />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={premiumColors.heroGradient}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.centerContainer}>
          <View style={styles.errorIconContainer}>
            <FontAwesome name="exclamation-circle" size={48} color={colors.error} />
          </View>
          <Text style={[styles.errorText, { color: colors.error }, isArabic && styles.arabicText]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { shadowColor: colors.primary }]} onPress={loadSummary}>
            <LinearGradient
              colors={premiumColors.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryButtonGradient}
            >
              <Text style={[styles.retryButtonText, { color: colors.white }]}>
                {isArabic ? 'حاول مرة أخرى' : 'Try Again'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!summary || summary.sections.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={premiumColors.heroGradient}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: premiumColors.glassBackground }]}>
            <FontAwesome name="newspaper-o" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyText, { color: colors.textMuted }, isArabic && styles.arabicText]}>
            {isArabic ? 'لا توجد أخبار متاحة الآن' : 'No stories available right now'}
          </Text>
          <TouchableOpacity style={[styles.retryButton, { shadowColor: colors.primary }]} onPress={loadSummary}>
            <LinearGradient
              colors={premiumColors.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryButtonGradient}
            >
              <Text style={[styles.retryButtonText, { color: colors.white }]}>
                {isArabic ? 'تحديث' : 'Refresh'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium gradient background */}
      <LinearGradient
        colors={premiumColors.heroGradient}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            HapticFeedback.buttonPress();
            router.back();
          }}
          style={[styles.backButton, { backgroundColor: premiumColors.glassBackground, borderColor: premiumColors.glassBorder }]}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
        >
          <FontAwesome
            name={isArabic ? 'arrow-right' : 'arrow-left'}
            size={20}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} />
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.shareButton, { backgroundColor: premiumColors.glassBackground, borderColor: premiumColors.glassBorder }]}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'مشاركة' : 'Share'}
        >
          <FontAwesome name="share" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Premium Hero */}
        <SummaryHero
          date={summary.generatedAt}
          totalStories={summary.totalStories}
          isArabic={isArabic}
        />

        {/* Topic Sections with staggered animation */}
        {summary.sections.map((section, index) => (
          <TopicSectionCard
            key={index}
            section={section}
            index={index}
            isArabic={isArabic}
          />
        ))}

        {/* Sources Footer */}
        <SourcesFooter
          sources={summary.sourceAttributions}
          isArabic={isArabic}
        />

        {/* Premium Regenerate Button with shimmer */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleRegenerate}
          onPressIn={handleRegeneratePressIn}
          onPressOut={handleRegeneratePressOut}
          disabled={isLoading}
          style={styles.regenerateButtonContainer}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'إنشاء ملخص جديد' : 'Generate New Digest'}
        >
          <Animated.View
            style={[
              styles.regenerateButton,
              { transform: [{ scale: scaleAnim }], shadowColor: premiumColors.goldGlow },
            ]}
            onLayout={handleButtonLayout}
          >
            {/* Gold gradient background */}
            <LinearGradient
              colors={premiumColors.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.regenerateGradient}
            />

            {/* Shimmer overlay */}
            {!reduceMotionRef.current && (
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    premiumColors.shimmerHighlight,
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            )}

            {/* Content */}
            <View style={styles.regenerateContent}>
              <FontAwesome name="refresh" size={16} color="#fff" />
              <Text style={[styles.regenerateButtonText, isArabic && styles.arabicText]}>
                {isArabic ? 'إنشاء ملخص جديد' : 'Generate New Digest'}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  shareButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  retryButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  regenerateButtonContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
  },
  regenerateButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  regenerateGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  regenerateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    zIndex: 2,
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
