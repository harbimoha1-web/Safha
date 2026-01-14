import { useState, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { useTopics, useSources, useTopicSourceMapping } from '@/hooks';
import { spacing, fontSize, fontWeight } from '@/constants/theme';
import { LanguageFilterBar } from './LanguageFilterBar';
import { TopicAccordion } from './TopicAccordion';
import type { LanguageFilter, Source } from '@/types';

interface SourceManagementProps {
  isArabic: boolean;
}

export function SourceManagement({ isArabic }: SourceManagementProps) {
  const { colors } = useTheme();
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();
  const { data: sources = [], isLoading: isLoadingSources } = useSources();
  const { data: topicSourceMapping = [], isLoading: isLoadingMapping } = useTopicSourceMapping();

  const { deselectedSources, toggleSourceSelection, toggleAllVisibleSources } = useAppStore();

  const isLoading = isLoadingTopics || isLoadingSources || isLoadingMapping;

  // Create a map of topic ID -> sources and track uncategorized sources
  const { topicSourcesMap, uncategorizedSources } = useMemo(() => {
    const map = new Map<string, Source[]>();
    const categorizedSourceIds = new Set<string>();

    // If we have mapping data, use it
    if (topicSourceMapping.length > 0) {
      topicSourceMapping.forEach((mapping) => {
        const topicSources = sources.filter((s) =>
          mapping.source_ids.includes(s.id)
        );
        map.set(mapping.topic_id, topicSources);
        // Track all categorized sources
        topicSources.forEach((s) => categorizedSourceIds.add(s.id));
      });
    } else {
      // Fallback: show all sources under each topic (for development)
      topics.forEach((topic) => {
        map.set(topic.id, sources);
      });
      // All sources are categorized in fallback mode
      sources.forEach((s) => categorizedSourceIds.add(s.id));
    }

    // Find sources without any topic association
    const uncategorized = sources.filter((s) => !categorizedSourceIds.has(s.id));

    return { topicSourcesMap: map, uncategorizedSources: uncategorized };
  }, [topics, sources, topicSourceMapping]);

  // Calculate total selected
  const totalSelected = useMemo(() => {
    const filteredSources = languageFilter === 'all'
      ? sources
      : sources.filter((s) => s.language === languageFilter);
    return filteredSources.filter((s) => !deselectedSources.includes(s.id)).length;
  }, [sources, languageFilter, deselectedSources]);

  const totalSources = useMemo(() => {
    return languageFilter === 'all'
      ? sources.length
      : sources.filter((s) => s.language === languageFilter).length;
  }, [sources, languageFilter]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Language Filter */}
      <LanguageFilterBar
        value={languageFilter}
        onChange={setLanguageFilter}
        isArabic={isArabic}
      />

      {/* Selection Summary */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: colors.textMuted }]}>
          {totalSelected}/{totalSources} {isArabic ? 'محدد' : 'selected'}
        </Text>
      </View>

      {/* Topics with Sources */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {topics.map((topic) => {
          const topicSources = topicSourcesMap.get(topic.id) || [];
          if (topicSources.length === 0) return null;

          return (
            <TopicAccordion
              key={topic.id}
              topic={topic}
              sources={topicSources}
              isExpanded={expandedTopicId === topic.id}
              onToggleExpand={() => setExpandedTopicId(
                expandedTopicId === topic.id ? null : topic.id
              )}
              languageFilter={languageFilter}
              onLanguageFilterChange={setLanguageFilter}
              deselectedSources={deselectedSources}
              onToggleSource={toggleSourceSelection}
              onSelectAll={toggleAllVisibleSources}
              isArabic={isArabic}
            />
          );
        })}

        {/* Uncategorized Sources */}
        {uncategorizedSources.length > 0 && (
          <TopicAccordion
            key="uncategorized"
            topic={{
              id: 'uncategorized',
              name_ar: 'مصادر أخرى',
              name_en: 'Other Sources',
              slug: 'uncategorized',
              icon: 'folder-o',
              color: '#888888',
              is_active: true,
              sort_order: 999,
            }}
            sources={uncategorizedSources}
            isExpanded={expandedTopicId === 'uncategorized'}
            onToggleExpand={() => setExpandedTopicId(
              expandedTopicId === 'uncategorized' ? null : 'uncategorized'
            )}
            languageFilter={languageFilter}
            onLanguageFilterChange={setLanguageFilter}
            deselectedSources={deselectedSources}
            onToggleSource={toggleSourceSelection}
            onSelectAll={toggleAllVisibleSources}
            isArabic={isArabic}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  summaryRow: {
    marginBottom: spacing.md,
  },
  summaryText: {
    fontSize: fontSize.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
});
