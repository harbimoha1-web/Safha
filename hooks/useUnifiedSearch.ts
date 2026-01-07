import { useMemo } from 'react';
import { useSearch } from './useSearch';
import { useTopics } from './useTopics';
import { useSources } from './useSources';
import type { Topic, Source, Story } from '@/types';

export interface UnifiedSearchResults {
  topics: Topic[];
  sources: Source[];
  stories: Story[];
  isLoading: boolean;
  hasResults: boolean;
}

export function useUnifiedSearch(query: string): UnifiedSearchResults {
  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length >= 2;

  // Fetch all topics and sources (cached via React Query)
  const { data: allTopics = [] } = useTopics();
  const { data: allSources = [] } = useSources();

  // Search stories via API (only when query is long enough)
  const { data: stories = [], isLoading: isLoadingStories } = useSearch(normalizedQuery);

  // Filter topics client-side
  const filteredTopics = useMemo(() => {
    if (!isSearching) return [];
    return allTopics.filter((topic) =>
      topic.name_ar.toLowerCase().includes(normalizedQuery) ||
      topic.name_en.toLowerCase().includes(normalizedQuery) ||
      topic.slug.toLowerCase().includes(normalizedQuery)
    );
  }, [allTopics, normalizedQuery, isSearching]);

  // Filter sources client-side
  const filteredSources = useMemo(() => {
    if (!isSearching) return [];
    return allSources.filter((source) =>
      source.name.toLowerCase().includes(normalizedQuery)
    );
  }, [allSources, normalizedQuery, isSearching]);

  const hasResults = filteredTopics.length > 0 || filteredSources.length > 0 || stories.length > 0;

  return {
    topics: filteredTopics,
    sources: filteredSources,
    stories: isSearching ? stories : [],
    isLoading: isSearching && isLoadingStories,
    hasResults,
  };
}
