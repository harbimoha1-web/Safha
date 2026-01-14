import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppStore } from '@/stores';
import { useSubscriptionStore } from '@/stores/subscription';
import { useTopics } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight, shadow } from '@/constants';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import { TopicGridSkeleton } from '@/components/SkeletonLoader';
import type { Topic } from '@/types';

// Horizontal chip-style Topic selector - readable, fast, scannable
function TopicChip({
  topic,
  isSelected,
  onPress,
  index,
  colors,
  isArabic,
}: {
  topic: Topic;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  colors: any;
  isArabic: boolean;
}) {
  const scale = useSharedValue(1);
  const topicColor = topic.color || getTopicColor(topic.slug);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          isArabic && styles.chipRtl,
          { backgroundColor: isSelected ? topicColor : colors.surface },
          !isSelected && { borderWidth: 1, borderColor: colors.border },
          isSelected && { ...shadow.md, shadowColor: topicColor },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={isArabic ? topic.name_ar : topic.name_en}
        accessibilityHint={isArabic ? 'انقر مرتين للتبديل' : 'Double tap to toggle'}
      >
        <FontAwesome
          name={getTopicIcon(topic.slug)}
          size={18}
          color={isSelected ? '#FFFFFF' : topicColor}
        />
        <Text
          style={[
            styles.chipText,
            { color: isSelected ? '#FFFFFF' : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {isArabic ? topic.name_ar : topic.name_en}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const { data: topics = [], isLoading: isLoadingTopics, isError, refetch } = useTopics();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { settings, setSelectedTopics, setOnboarded, selectedTopics } = useAppStore();
  const { isPremium } = useSubscriptionStore();
  const topicLimit = useSubscriptionStore((state) => state.getTopicLimit());
  const { colors } = useTheme();

  const isArabic = settings.language === 'ar';

  // Hydrate local state from store on mount (for editing existing selections)
  useEffect(() => {
    if (selectedTopics.length > 0) {
      setSelectedIds(new Set(selectedTopics.map((t: Topic) => t.id)));
    }
  }, []);

  const toggleTopic = (topicId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else if (newSet.size < topicLimit) {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  // No minimum required - users can proceed with any number of topics (including 0)
  const handleContinue = () => {
    const selected = topics.filter((t) => selectedIds.has(t.id));
    setSelectedTopics(selected);
    setOnboarded(true);
    router.replace('/(tabs)/search');
  };

  const handleSkip = () => {
    setSelectedTopics([]);
    setOnboarded(true);
    router.replace('/(tabs)/search');
  };

  // Show error state if topics failed to load
  if (isError || (!isLoadingTopics && topics.length === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={64} color={colors.error || '#DC2626'} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
            {isArabic ? 'تعذر تحميل المواضيع' : 'Could not load topics'}
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {isArabic
              ? 'تأكد من اتصالك بالإنترنت وحاول مرة أخرى'
              : 'Check your internet connection and try again'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إعادة المحاولة' : 'Retry'}
          >
            <FontAwesome name="refresh" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>
              {isArabic ? 'إعادة المحاولة' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'رجوع' : 'Back'}
        >
          <FontAwesome name={isArabic ? 'arrow-right' : 'arrow-left'} size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {isArabic ? 'تخطي' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {isArabic ? 'اختر اهتماماتك' : 'Choose Your Interests'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic
            ? 'نغطي كل ما يهمك - من الأخبار للرياضة للتقنية والمزيد'
            : 'We cover everything you care about - news, sports, tech, and more'}
        </Text>
      </Animated.View>

      {/* Topics - Horizontal chip flow */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.chipsContainer,
          isArabic && styles.chipsContainerRtl,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingTopics ? (
          <TopicGridSkeleton count={12} />
        ) : (
          topics.map((topic, index) => (
            <TopicChip
              key={topic.id}
              topic={topic}
              isSelected={selectedIds.has(topic.id)}
              onPress={() => toggleTopic(topic.id)}
              index={index}
              colors={colors}
              isArabic={isArabic}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}
      >
        <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
          {selectedIds.size} / {isPremium ? '∞' : topicLimit}{' '}
          {isArabic ? 'مواضيع محددة' : 'topics selected'}
        </Text>

        {!isPremium && selectedIds.size >= topicLimit && (
          <Animated.View entering={FadeIn.duration(300)}>
            <TouchableOpacity
              style={styles.upgradePrompt}
              onPress={() => router.push('/subscription')}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'اشترك للمزيد' : 'Upgrade for unlimited topics'}
            >
              <FontAwesome name="star" size={14} color="#FFD700" />
              <Text style={[styles.upgradeText, { color: colors.primary }]}>
                {isArabic ? 'اشترك للمزيد من المواضيع' : 'Upgrade for unlimited topics'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }, shadow.sm]}
          onPress={handleContinue}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>
              {selectedIds.size === 0
                ? (isArabic ? 'تخطي' : 'Skip')
                : (isArabic ? 'متابعة' : 'Continue')}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.md,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  arabicText: {
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  chipsContainerRtl: {
    flexDirection: 'row-reverse',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
    gap: spacing.sm,
  },
  chipRtl: {
    flexDirection: 'row-reverse',
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  selectedCount: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  upgradeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  continueButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: fontSize.md,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.xxl,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
