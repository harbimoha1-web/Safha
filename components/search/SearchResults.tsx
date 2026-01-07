import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import type { Topic, Source, Story } from '@/types';
import type { UnifiedSearchResults } from '@/hooks/useUnifiedSearch';

interface SearchResultsProps {
  results: UnifiedSearchResults;
  isArabic: boolean;
  onClose: () => void;
}

export function SearchResults({ results, isArabic, onClose }: SearchResultsProps) {
  const { colors } = useTheme();
  const { topics, sources, stories, isLoading, hasResults } = results;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!hasResults) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="search" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isArabic ? 'لا توجد نتائج' : 'No results found'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Topics Section */}
      {topics.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="tags" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {isArabic ? 'المواضيع' : 'Topics'}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countText}>{topics.length}</Text>
            </View>
          </View>
          {topics.map((topic) => (
            <TopicResultItem key={topic.id} topic={topic} isArabic={isArabic} />
          ))}
        </View>
      )}

      {/* Sources Section */}
      {sources.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="newspaper-o" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {isArabic ? 'المصادر' : 'Sources'}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countText}>{sources.length}</Text>
            </View>
          </View>
          {sources.map((source) => (
            <SourceResultItem key={source.id} source={source} isArabic={isArabic} />
          ))}
        </View>
      )}

      {/* Stories Section */}
      {stories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="file-text-o" size={14} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {isArabic ? 'الأخبار' : 'Stories'}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countText}>{stories.length}</Text>
            </View>
          </View>
          {stories.map((story) => (
            <StoryResultItem key={story.id} story={story} isArabic={isArabic} onPress={onClose} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Topic Result Item
function TopicResultItem({ topic, isArabic }: { topic: Topic; isArabic: boolean }) {
  const { colors } = useTheme();
  const { selectedTopics, setSelectedTopics } = useAppStore();

  const isSelected = selectedTopics.some((t) => t.id === topic.id);
  const topicColor = topic.color || getTopicColor(topic.slug);

  const handleToggle = () => {
    if (isSelected) {
      setSelectedTopics(selectedTopics.filter((t) => t.id !== topic.id));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surface }]}
      onPress={handleToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isSelected }}
    >
      <View style={[styles.topicIcon, { backgroundColor: topicColor }]}>
        <FontAwesome name={getTopicIcon(topic.slug)} size={16} color="#fff" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
          {isArabic ? topic.name_ar : topic.name_en}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.typeText, { color: colors.textMuted }]}>
            {isArabic ? 'موضوع' : 'Topic'}
          </Text>
        </View>
      </View>
      <Switch
        value={isSelected}
        onValueChange={handleToggle}
        trackColor={{ false: colors.surfaceLight, true: colors.primary }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );
}

// Source Result Item
function SourceResultItem({ source, isArabic }: { source: Source; isArabic: boolean }) {
  const { colors } = useTheme();
  const { deselectedSources, toggleSourceSelection } = useAppStore();

  const isSelected = !deselectedSources.includes(source.id);

  return (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: colors.surface }]}
      onPress={() => toggleSourceSelection(source.id)}
      accessibilityRole="switch"
      accessibilityState={{ checked: isSelected }}
    >
      {source.logo_url ? (
        <Image source={{ uri: source.logo_url }} style={styles.sourceLogo} />
      ) : (
        <View style={[styles.sourceLogoPlaceholder, { backgroundColor: colors.surfaceLight }]}>
          <FontAwesome name="newspaper-o" size={16} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
          {source.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.languageBadge, { backgroundColor: source.language === 'ar' ? '#4ECDC4' : '#45B7D1' }]}>
            <Text style={styles.languageBadgeText}>
              {source.language === 'ar' ? 'عربي' : 'EN'}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.typeText, { color: colors.textMuted }]}>
              {isArabic ? 'مصدر' : 'Source'}
            </Text>
          </View>
        </View>
      </View>
      <Switch
        value={isSelected}
        onValueChange={() => toggleSourceSelection(source.id)}
        trackColor={{ false: colors.surfaceLight, true: colors.primary }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );
}

// Story Result Item
function StoryResultItem({ story, isArabic, onPress }: { story: Story; isArabic: boolean; onPress: () => void }) {
  const { colors } = useTheme();

  const title = isArabic ? story.title_ar : story.title_en;
  const sourceName = story.source?.name || '';
  const date = story.published_at
    ? new Date(story.published_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '';

  const handlePress = () => {
    onPress();
    router.push(`/story/${story.id}`);
  };

  return (
    <TouchableOpacity
      style={[styles.storyItem, { backgroundColor: colors.surface }]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={title || 'Story'}
    >
      {story.image_url && (
        <Image source={{ uri: story.image_url }} style={styles.storyImage} />
      )}
      <View style={styles.storyContent}>
        <Text style={[styles.storyTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.storyMeta}>
          <Text style={[styles.storySource, { color: colors.textMuted }]} numberOfLines={1}>
            {sourceName}
          </Text>
          {date && (
            <>
              <Text style={[styles.storyDot, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.storyDate, { color: colors.textMuted }]}>{date}</Text>
            </>
          )}
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.surfaceLight, marginTop: spacing.xs }]}>
          <Text style={[styles.typeText, { color: colors.textMuted }]}>
            {isArabic ? 'خبر' : 'Story'}
          </Text>
        </View>
      </View>
      <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sourceLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  languageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  languageBadgeText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
  },
  storyContent: {
    flex: 1,
  },
  storyTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storySource: {
    fontSize: fontSize.xs,
    maxWidth: 100,
  },
  storyDot: {
    fontSize: fontSize.xs,
    marginHorizontal: 4,
  },
  storyDate: {
    fontSize: fontSize.xs,
  },
});
