import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ContentLanguageSelector } from '@/components/ContentLanguageSelector';
import { TopicGridSkeleton } from '@/components/SkeletonLoader';
import { useAppStore } from '@/stores';
import { useSubscriptionStore } from '@/stores/subscription';
import { useTopics } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import type { Topic } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.lg * 2 - spacing.sm * 2) / 3;

// Beautiful topic card component
function TopicCard({
  topic,
  isSelected,
  onPress,
  colors,
  isArabic,
  index,
}: {
  topic: Topic;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
  isArabic: boolean;
  index: number;
}) {
  const scale = useSharedValue(1);
  const topicColor = topic.color || getTopicColor(topic.slug);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 20, 100)).duration(200)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.topicCard,
          { backgroundColor: isSelected ? topicColor : colors.background },
          !isSelected && { borderWidth: 1.5, borderColor: colors.border },
          isSelected && {
            shadowColor: topicColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 10,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={isArabic ? topic.name_ar : topic.name_en}
      >
        {/* Checkmark badge */}
        {isSelected && (
          <View style={styles.checkBadge}>
            <FontAwesome name="check" size={10} color={topicColor} />
          </View>
        )}

        {/* Icon */}
        <View
          style={[
            styles.topicIconContainer,
            {
              backgroundColor: isSelected
                ? 'rgba(255,255,255,0.25)'
                : `${topicColor}15`,
            },
          ]}
        >
          <FontAwesome
            name={getTopicIcon(topic.slug)}
            size={22}
            color={isSelected ? '#fff' : topicColor}
          />
        </View>

        {/* Name */}
        <Text
          style={[
            styles.topicName,
            { color: isSelected ? '#fff' : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {isArabic ? topic.name_ar : topic.name_en}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Animated progress bar
function SelectionProgress({
  current,
  max,
  colors,
  isArabic,
}: {
  current: number;
  max: number | null;
  colors: any;
  isArabic: boolean;
}) {
  const progress = useSharedValue(0);
  const progressPercent = max ? Math.min(current / max, 1) : 0.5;

  useEffect(() => {
    progress.value = withTiming(progressPercent, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [current, max]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary },
            animatedBarStyle,
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
        {current} {isArabic ? 'من' : 'of'} {max ?? '∞'} {isArabic ? 'محدد' : 'selected'}
      </Text>
    </View>
  );
}

// Gold upgrade card
function UpgradeCard({ colors, isArabic }: { colors: any; isArabic: boolean }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(50).duration(200)}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={() => router.push('/subscription')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={isArabic ? 'ترقية للمزيد' : 'Upgrade for more'}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.upgradeCard}
        >
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeIconContainer}>
              <FontAwesome name="star" size={20} color="#fff" />
            </View>
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>
                {isArabic ? 'أطلق العنان لاهتماماتك' : 'Unlock Unlimited Topics'}
              </Text>
              <Text style={styles.upgradeSubtitle}>
                {isArabic ? 'اشترك الآن واحصل على المزيد' : 'Subscribe to follow all your interests'}
              </Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const { settings, selectedTopics, setSelectedTopics } = useAppStore();
  const { isPremium } = useSubscriptionStore();
  const topicLimit = useSubscriptionStore((state) => state.getTopicLimit());
  const { colors } = useTheme();

  const isArabic = settings.language === 'ar';

  // Fetch all available topics
  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();

  // Track selected topic IDs locally for UI
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync from store on mount
  useEffect(() => {
    if (selectedTopics.length > 0) {
      setSelectedIds(new Set(selectedTopics.map((t) => t.id)));
    }
  }, []);

  // Toggle topic selection and save immediately
  const toggleTopic = (topicId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else if (newSet.size < topicLimit || isPremium) {
        newSet.add(topicId);
      }

      // Save to store immediately
      const selected = topics.filter((t) => newSet.has(t.id));
      setSelectedTopics(selected);

      return newSet;
    });
  };

  const showUpgradeCard = !isPremium && selectedIds.size >= topicLimit;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Language Selector */}
        <ContentLanguageSelector isArabic={isArabic} />

        {/* Interests Section */}
        <Animated.View
          entering={FadeIn.duration(150)}
          style={[styles.sectionCard, { backgroundColor: colors.surface }]}
        >
          {/* Header */}
          <View style={[styles.sectionHeader, isArabic && styles.sectionHeaderRtl]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#FF6B6B20' }]}>
              <FontAwesome name="heart" size={18} color="#FF6B6B" />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }, isArabic && styles.textRtl]}
              >
                {isArabic ? 'اهتماماتك' : 'Your Interests'}
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.textMuted }, isArabic && styles.textRtl]}
              >
                {isArabic ? 'اختر ما يهمك' : 'Select what matters to you'}
              </Text>
            </View>
          </View>

          {/* Topic Cards Grid */}
          {isLoadingTopics ? (
            <TopicGridSkeleton count={9} />
          ) : (
            <View style={[styles.topicsGrid, isArabic && styles.topicsGridRtl]}>
              {topics.map((topic, index) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  isSelected={selectedIds.has(topic.id)}
                  onPress={() => toggleTopic(topic.id)}
                  colors={colors}
                  isArabic={isArabic}
                  index={index}
                />
              ))}
            </View>
          )}

          {/* Selection Progress */}
          <SelectionProgress
            current={selectedIds.size}
            max={isPremium ? null : topicLimit}
            colors={colors}
            isArabic={isArabic}
          />

          {/* Upgrade Card */}
          {showUpgradeCard && <UpgradeCard colors={colors} isArabic={isArabic} />}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xxxl,
  },
  sectionCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionHeaderRtl: {
    flexDirection: 'row-reverse',
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  textRtl: {
    textAlign: 'right',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  topicsGridRtl: {
    flexDirection: 'row-reverse',
  },
  topicCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + 10,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  topicName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: fontSize.xs,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  upgradeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  upgradeSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
