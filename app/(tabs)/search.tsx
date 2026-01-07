import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SearchResultSkeleton, TopicGridSkeleton } from '@/components/SkeletonLoader';
import { TopicAccordion } from '@/components/sources';
import { FontAwesome } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useAppStore } from '@/stores';
import { useTopics, useSources, useSearch, useDebouncedValue, useTopicSourceMapping } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import { SEARCH_DEBOUNCE_MS } from '@/constants/config';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { Story, LanguageFilter, Source } from '@/types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const { settings, addRecentSearch, deselectedSources, toggleSourceSelection, selectAllVisibleSources } = useAppStore();
  const { colors } = useTheme();

  const isArabic = settings.language === 'ar';

  // Debounced search query
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  // React Query hooks
  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: sources = [], isLoading: isLoadingSources } = useSources();
  const { data: results = [], isLoading: isSearching } = useSearch(debouncedQuery);
  const { data: topicSourceMapping = [] } = useTopicSourceMapping();

  // Create a map of topic ID -> sources
  const topicSourcesMap = useMemo(() => {
    const map = new Map<string, Source[]>();

    if (topicSourceMapping.length > 0) {
      topicSourceMapping.forEach((mapping) => {
        const topicSources = sources.filter((s) =>
          mapping.source_ids.includes(s.id)
        );
        map.set(mapping.topic_id, topicSources);
      });
    } else {
      // Fallback: show all sources under each topic (for development)
      topics.forEach((topic) => {
        map.set(topic.id, sources);
      });
    }

    return map;
  }, [topics, sources, topicSourceMapping]);

  // Track last saved search to avoid duplicates
  const lastSavedSearch = useRef<string>('');

  // Add to recent searches when we get results
  useEffect(() => {
    if (results.length > 0 && debouncedQuery.length >= 2 && debouncedQuery !== lastSavedSearch.current) {
      addRecentSearch(debouncedQuery);
      lastSavedSearch.current = debouncedQuery;
    }
  }, [results.length, debouncedQuery, addRecentSearch]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const handleToggleExpand = useCallback((topicId: string) => {
    setExpandedTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <FontAwesome name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }, isArabic && styles.arabicText]}
            placeholder={isArabic ? 'ابحث في اهتماماتك...' : 'Search your interests...'}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel={isArabic ? 'بحث في اهتماماتك' : 'Search your interests'}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'مسح البحث' : 'Clear search'}
            >
              <FontAwesome name="times-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isSearching ? (
        <View style={styles.resultsList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </View>
      ) : query.length > 0 && results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="search" size={48} color={colors.surfaceLight} />
          <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
            {isArabic ? 'لا توجد نتائج' : 'No results found'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            {isArabic
              ? 'جرب البحث بكلمات مختلفة'
              : 'Try searching with different keywords'}
          </Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultCard, { backgroundColor: colors.surface }]}
              onPress={() => handleStoryPress(item.id)}
              accessibilityRole="button"
              accessibilityLabel={(isArabic ? item.title_ar : item.title_en) || undefined}
            >
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.resultImage} />
              )}
              <View style={styles.resultContent}>
                <Text
                  style={[styles.resultTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}
                  numberOfLines={2}
                >
                  {isArabic ? item.title_ar : item.title_en}
                </Text>
                <Text style={[styles.resultMeta, { color: colors.textMuted }]}>
                  {item.source?.name} • {new Date(item.published_at || item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Manage Interests Card */}
          <TouchableOpacity
            style={[styles.interestsCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/onboarding')}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إدارة اهتماماتك' : 'Manage your interests'}
          >
            <View style={[styles.interestsCardContent, isArabic && styles.interestsCardContentRtl]}>
              <View style={styles.interestsCardIcon}>
                <FontAwesome name="sliders" size={20} color="#fff" />
              </View>
              <View style={styles.interestsCardText}>
                <Text style={[styles.interestsCardTitle, isArabic && styles.arabicText]}>
                  {isArabic ? 'إدارة اهتماماتك' : 'Manage Your Interests'}
                </Text>
                <Text style={[styles.interestsCardSubtitle, isArabic && styles.arabicText]}>
                  {isArabic ? 'خصص المواضيع التي تتابعها' : 'Customize the topics you follow'}
                </Text>
              </View>
            </View>
            <FontAwesome name={isArabic ? 'chevron-left' : 'chevron-right'} size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Topics Section Title */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
            {isArabic ? 'استكشف المواضيع' : 'Explore Topics'}
          </Text>

          {/* Topics with Expandable Sources */}
          {isLoadingTopics ? (
            <TopicGridSkeleton count={6} />
          ) : (
            topics.map((topic) => (
              <TopicAccordion
                key={topic.id}
                topic={topic}
                sources={topicSourcesMap.get(topic.id) || []}
                isExpanded={expandedTopicId === topic.id}
                onToggleExpand={() => handleToggleExpand(topic.id)}
                languageFilter={languageFilter}
                onLanguageFilterChange={setLanguageFilter}
                deselectedSources={deselectedSources}
                onToggleSource={toggleSourceSelection}
                onSelectAll={selectAllVisibleSources}
                isArabic={isArabic}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  arabicText: {
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  clearButton: {
    fontSize: fontSize.sm,
  },
  recentSearches: {
    marginBottom: spacing.lg,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  recentSearchText: {
    fontSize: fontSize.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  interestsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  interestsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  interestsCardContentRtl: {
    flexDirection: 'row-reverse',
  },
  interestsCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestsCardText: {
    flex: 1,
  },
  interestsCardTitle: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  interestsCardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  topicCard: {
    width: '47%',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicIcon: {
    fontSize: 24,
  },
  topicName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  resultsList: {
    padding: spacing.lg,
  },
  resultCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  resultImage: {
    width: 100,
    height: 80,
  },
  resultContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  resultMeta: {
    fontSize: fontSize.xs,
  },
  searchTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  searchTabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  sourcesList: {
    gap: spacing.sm,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  sourceLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sourceLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sourceLanguage: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
