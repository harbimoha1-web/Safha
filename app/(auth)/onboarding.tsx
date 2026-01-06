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
import { useAppStore, useAuthStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { getTopics } from '@/lib/api';
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import type { Topic } from '@/types';

// Mock topics for initial development
const MOCK_TOPICS: Topic[] = [
  { id: '1', name_ar: 'سياسة', name_en: 'Politics', slug: 'politics', icon: '🏛️', color: '#FF6B6B', is_active: true, sort_order: 1 },
  { id: '2', name_ar: 'اقتصاد', name_en: 'Economy', slug: 'economy', icon: '📈', color: '#4ECDC4', is_active: true, sort_order: 2 },
  { id: '3', name_ar: 'رياضة', name_en: 'Sports', slug: 'sports', icon: '⚽', color: '#45B7D1', is_active: true, sort_order: 3 },
  { id: '4', name_ar: 'تقنية', name_en: 'Technology', slug: 'technology', icon: '💻', color: '#96CEB4', is_active: true, sort_order: 4 },
  { id: '5', name_ar: 'ترفيه', name_en: 'Entertainment', slug: 'entertainment', icon: '🎬', color: '#FFEAA7', is_active: true, sort_order: 5 },
  { id: '6', name_ar: 'صحة', name_en: 'Health', slug: 'health', icon: '🏥', color: '#DDA0DD', is_active: true, sort_order: 6 },
  { id: '7', name_ar: 'علوم', name_en: 'Science', slug: 'science', icon: '🔬', color: '#98D8C8', is_active: true, sort_order: 7 },
  { id: '8', name_ar: 'سفر', name_en: 'Travel', slug: 'travel', icon: '✈️', color: '#F7DC6F', is_active: true, sort_order: 8 },
];

export default function OnboardingScreen() {
  const [topics, setTopics] = useState<Topic[]>(MOCK_TOPICS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useAppStore();
  const { setSelectedTopics, setOnboarded } = useAppStore();
  const { colors } = useTheme();

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const data = await getTopics();
      if (data.length > 0) {
        setTopics(data);
      }
    } catch (error) {
      // Use mock topics if API fails
      console.log('Using mock topics');
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
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
            ? 'اختر 3 مواضيع على الأقل لتخصيص تجربتك'
            : 'Select at least 3 topics to personalize your feed'}
        </Text>
      </View>

      {/* Topics Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.topicsGrid}
        showsVerticalScrollIndicator={false}
      >
        {topics.map((topic) => {
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
        })}
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
          {selectedIds.size} / 3{' '}
          {isArabic ? 'مواضيع محددة' : 'topics selected'}
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            selectedIds.size < 3 && [styles.continueButtonDisabled, { backgroundColor: colors.surfaceLight }],
          ]}
          onPress={handleContinue}
          disabled={selectedIds.size < 3 || isLoading}
        >
          {isLoading ? (
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
    marginBottom: spacing.lg,
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
