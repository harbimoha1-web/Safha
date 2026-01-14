// Topic Detail Screen - Shows stories for a specific topic
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAppStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { useStoriesByTopic, useTopics } from '@/hooks';
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme';
import { getTopicIcon } from '@/constants/topicIcons';
import { SearchResultSkeleton } from '@/components/SkeletonLoader';
import type { Story, Topic } from '@/types';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useAppStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';

  // Get topic info
  const { data: topics = [] } = useTopics();
  const topic = topics.find((t) => t.id === id);

  // Get stories for this topic
  const { data: stories = [], isLoading, error, refetch } = useStoriesByTopic(id);

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity
      style={[styles.storyCard, { backgroundColor: colors.surface }]}
      onPress={() => handleStoryPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={(isArabic ? item.title_ar : item.title_en) || item.original_title || undefined}
    >
      <OptimizedImage
        url={item.image_url}
        style={styles.storyImage}
        height={180}
        resizeMode="cover"
        fallbackIcon="newspaper-o"
      />
      <View style={styles.storyContent}>
        <Text
          style={[styles.storyTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}
          numberOfLines={2}
        >
          {(isArabic ? item.title_ar : item.title_en) || item.original_title}
        </Text>
        <Text
          style={[styles.storySummary, { color: colors.textSecondary }, isArabic && styles.arabicText]}
          numberOfLines={2}
        >
          {isArabic ? item.summary_ar : item.summary_en}
        </Text>
        <Text style={[styles.storyMeta, { color: colors.textMuted }]}>
          {item.source?.name} • {new Date(item.published_at || item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: topic?.color || colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
        >
          <FontAwesome name={isArabic ? 'arrow-right' : 'arrow-left'} size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <FontAwesome
            name={getTopicIcon(topic?.slug || '')}
            size={32}
            color="#fff"
          />
          <Text style={[styles.headerTitle, isArabic && styles.arabicText]}>
            {isArabic ? topic?.name_ar : topic?.name_en}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isArabic ? `${stories.length} خبر` : `${stories.length} stories`}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            {isArabic ? 'فشل في تحميل الأخبار' : 'Failed to load stories'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>
              {isArabic ? 'إعادة المحاولة' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : stories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="inbox" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
            {isArabic ? 'لا توجد أخبار' : 'No stories yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            {isArabic
              ? 'سيتم إضافة أخبار جديدة قريباً'
              : 'New stories will be added soon'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={renderStoryItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: '#fff',
    marginTop: spacing.sm,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  arabicText: {
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.lg,
  },
  storyCard: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: 180,
  },
  storyContent: {
    padding: spacing.lg,
  },
  storyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  storySummary: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  storyMeta: {
    fontSize: fontSize.xs,
  },
});
