import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { TopicGridSkeleton } from '@/components/SkeletonLoader';
import { TopicAccordion } from '@/components/sources';
import { SearchResults } from '@/components/search';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores';
import { useTopics, useSources, useTopicSourceMapping, useDebouncedValue, useUnifiedSearch } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { SEARCH_DEBOUNCE_MS } from '@/constants/config';
import type { LanguageFilter, Source } from '@/types';

export default function SearchScreen() {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { settings, deselectedSources, toggleSourceSelection, selectAllVisibleSources } = useAppStore();
  const { colors } = useTheme();

  const isArabic = settings.language === 'ar';
  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const searchResults = useUnifiedSearch(debouncedQuery);
  const isSearching = searchQuery.trim().length > 0;

  // React Query hooks
  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: sources = [] } = useSources();
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

  const handleToggleExpand = useCallback((topicId: string) => {
    setExpandedTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <FontAwesome name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={isArabic ? 'ابحث في المواضيع والمصادر والأخبار...' : 'Search topics, sources, stories...'}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome name="times-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Show Search Results when searching */}
      {isSearching ? (
        <SearchResults
          results={searchResults}
          isArabic={isArabic}
          onClose={() => setSearchQuery('')}
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
  searchBarContainer: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  arabicText: {
    textAlign: 'right',
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
});
