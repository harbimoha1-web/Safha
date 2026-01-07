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
import { useAppStore } from '@/stores';
import { useSubscriptionStore } from '@/stores/subscription';
import { useTopics } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import { TopicGridSkeleton } from '@/components/SkeletonLoader';
import type { Topic } from '@/types';

// Mock topics for initial development
const MOCK_TOPICS: Topic[] = [
  // Core topics
  { id: '1', name_ar: 'السياسة', name_en: 'Politics', slug: 'politics', icon: 'university', color: '#DC2626', is_active: true, sort_order: 1 },
  { id: '2', name_ar: 'الاقتصاد', name_en: 'Economy', slug: 'economy', icon: 'line-chart', color: '#16A34A', is_active: true, sort_order: 2 },
  { id: '3', name_ar: 'التكنولوجيا', name_en: 'Technology', slug: 'technology', icon: 'laptop', color: '#7C3AED', is_active: true, sort_order: 3 },
  // New topics
  { id: '4', name_ar: 'الطعام والمشروبات', name_en: 'Food & Drink', slug: 'food-drink', icon: 'cutlery', color: '#F97316', is_active: true, sort_order: 4 },
  { id: '5', name_ar: 'الجمال والأناقة', name_en: 'Beauty & Style', slug: 'beauty-style', icon: 'diamond', color: '#EC4899', is_active: true, sort_order: 5 },
  { id: '6', name_ar: 'الموسيقى', name_en: 'Music', slug: 'music', icon: 'music', color: '#8B5CF6', is_active: true, sort_order: 6 },
  { id: '7', name_ar: 'اللياقة والصحة', name_en: 'Fitness & Health', slug: 'fitness-health', icon: 'heartbeat', color: '#10B981', is_active: true, sort_order: 7 },
  { id: '8', name_ar: 'فلوقات', name_en: 'Vlogs', slug: 'vlogs', icon: 'video-camera', color: '#06B6D4', is_active: true, sort_order: 8 },
  { id: '9', name_ar: 'كوميديا', name_en: 'Comedy', slug: 'comedy', icon: 'smile-o', color: '#FBBF24', is_active: true, sort_order: 9 },
  { id: '10', name_ar: 'الرياضة', name_en: 'Sports', slug: 'sports', icon: 'futbol-o', color: '#2563EB', is_active: true, sort_order: 10 },
  { id: '11', name_ar: 'الثقافة الترفيهية', name_en: 'Entertainment Culture', slug: 'entertainment-culture', icon: 'film', color: '#DB2777', is_active: true, sort_order: 11 },
  { id: '12', name_ar: 'العلوم والتعليم', name_en: 'Science & Education', slug: 'science-education', icon: 'graduation-cap', color: '#0891B2', is_active: true, sort_order: 12 },
  { id: '13', name_ar: 'العائلة', name_en: 'Family', slug: 'family', icon: 'users', color: '#F472B6', is_active: true, sort_order: 13 },
  { id: '14', name_ar: 'التحفيز والنصائح', name_en: 'Motivation & Advice', slug: 'motivation-advice', icon: 'lightbulb-o', color: '#A855F7', is_active: true, sort_order: 14 },
  { id: '15', name_ar: 'الرقص', name_en: 'Dance', slug: 'dance', icon: 'star', color: '#F43F5E', is_active: true, sort_order: 15 },
  { id: '16', name_ar: 'السفر', name_en: 'Travel', slug: 'travel', icon: 'plane', color: '#F59E0B', is_active: true, sort_order: 16 },
  { id: '17', name_ar: 'الألعاب', name_en: 'Gaming', slug: 'gaming', icon: 'gamepad', color: '#6366F1', is_active: true, sort_order: 17 },
  { id: '18', name_ar: 'الحيوانات الأليفة', name_en: 'Pets', slug: 'pets', icon: 'paw', color: '#84CC16', is_active: true, sort_order: 18 },
  { id: '19', name_ar: 'السيارات والمركبات', name_en: 'Auto & Vehicle', slug: 'auto-vehicle', icon: 'car', color: '#EF4444', is_active: true, sort_order: 19 },
  { id: '20', name_ar: 'افعلها بنفسك', name_en: 'DIY', slug: 'diy', icon: 'wrench', color: '#78716C', is_active: true, sort_order: 20 },
  { id: '21', name_ar: 'الفن', name_en: 'Art', slug: 'art', icon: 'paint-brush', color: '#D946EF', is_active: true, sort_order: 21 },
  { id: '22', name_ar: 'الأنمي والقصص المصورة', name_en: 'Anime & Comics', slug: 'anime-comics', icon: 'book', color: '#FB7185', is_active: true, sort_order: 22 },
  { id: '23', name_ar: 'حيل الحياة', name_en: 'Life Hacks', slug: 'life-hacks', icon: 'magic', color: '#14B8A6', is_active: true, sort_order: 23 },
  { id: '24', name_ar: 'الطبيعة', name_en: 'Outdoors', slug: 'outdoors', icon: 'tree', color: '#22C55E', is_active: true, sort_order: 24 },
  { id: '25', name_ar: 'مرضي بشكل غريب', name_en: 'Oddly Satisfying', slug: 'oddly-satisfying', icon: 'eye', color: '#7C3AED', is_active: true, sort_order: 25 },
  { id: '26', name_ar: 'المنزل والحديقة', name_en: 'Home & Garden', slug: 'home-garden', icon: 'home', color: '#059669', is_active: true, sort_order: 26 },
];

export default function OnboardingScreen() {
  const { data: topics = MOCK_TOPICS, isLoading: isLoadingTopics } = useTopics();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { settings, setSelectedTopics, setOnboarded, selectedTopics } = useAppStore();
  const { isPremium } = useSubscriptionStore();
  const topicLimit = useSubscriptionStore((state) => state.getTopicLimit());
  const { colors } = useTheme();

  // Hydrate local state from store on mount (for editing existing selections)
  useEffect(() => {
    if (selectedTopics.length > 0) {
      setSelectedIds(new Set(selectedTopics.map((t) => t.id)));
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

  const handleContinue = () => {
    if (selectedIds.size < 3) {
      return;
    }

    const selected = topics.filter((t) => selectedIds.has(t.id));
    setSelectedTopics(selected);
    setOnboarded(true);
    router.replace('/(tabs)/feed');
  };

  const isArabic = settings.language === 'ar';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
        >
          <FontAwesome name="times" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {isArabic ? 'اختر اهتماماتك' : 'Choose Your Interests'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isArabic
            ? 'نغطي كل ما يهمك - من الأخبار للرياضة للتقنية والمزيد'
            : 'We cover everything you care about - news, sports, tech, and more'}
        </Text>
      </View>

      {/* Topics Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.topicsGrid}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingTopics ? (
          <TopicGridSkeleton count={8} />
        ) : (
          topics.map((topic) => {
            const isSelected = selectedIds.has(topic.id);
            const topicColor = topic.color || getTopicColor(topic.slug);
            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicCard,
                  { backgroundColor: colors.surface },
                  topicColor && { borderColor: topicColor },
                  isSelected && topicColor && { backgroundColor: topicColor },
                ]}
                onPress={() => toggleTopic(topic.id)}
                activeOpacity={0.7}
              >
                <FontAwesome
                  name={getTopicIcon(topic.slug)}
                  size={32}
                  color={isSelected ? '#FFFFFF' : topicColor}
                />
                <Text
                  style={[
                    styles.topicName,
                    { color: colors.textPrimary },
                    isSelected && styles.topicNameSelected,
                  ]}
                >
                  {isArabic ? topic.name_ar : topic.name_en}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
          {selectedIds.size} / {isPremium ? '∞' : topicLimit}{' '}
          {isArabic ? 'مواضيع محددة' : 'topics selected'}
        </Text>
        {!isPremium && selectedIds.size >= topicLimit && (
          <TouchableOpacity
            style={styles.upgradePrompt}
            onPress={() => router.push('/subscription')}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'اشترك للمزيد' : 'Upgrade for unlimited topics'}
          >
            <FontAwesome name="star" size={14} color="#FFD700" />
            <Text style={[styles.upgradeText, { color: colors.primary }]}>
              {isArabic ? 'اشترك للمزيد' : 'Upgrade for unlimited topics'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            selectedIds.size < 3 && [styles.continueButtonDisabled, { backgroundColor: colors.surfaceLight }],
          ]}
          onPress={handleContinue}
          disabled={selectedIds.size < 3 || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.continueButtonText, selectedIds.size < 3 && { color: colors.textMuted }]}>
              {isArabic ? 'متابعة' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: spacing.xl,
    padding: spacing.sm,
    zIndex: 10,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  topicCard: {
    width: '47%',
    aspectRatio: 1.5,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicIcon: {
    fontSize: 32,
  },
  topicName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  topicNameSelected: {
    color: '#000',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
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
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  upgradeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  continueButton: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    // backgroundColor applied dynamically
  },
  continueButtonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
