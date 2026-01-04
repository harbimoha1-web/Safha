import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SearchResultSkeleton } from '@/components/SkeletonLoader';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores';
import { useTopics, useSearch, useDebouncedValue } from '@/hooks';
import { SEARCH_DEBOUNCE_MS } from '@/constants/config';
import type { Story } from '@/types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { settings, recentSearches, addRecentSearch, clearRecentSearches } = useAppStore();

  const isArabic = settings.language === 'ar';

  // Debounced search query
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  // React Query hooks
  const { data: topics = [] } = useTopics();
  const { data: results = [], isLoading: isSearching } = useSearch(debouncedQuery);

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

  const handleTopicPress = (topic: typeof topics[0]) => {
    // Set query to topic name and search
    const searchTerm = isArabic ? topic.name_ar : topic.name_en;
    handleSearch(searchTerm);
  };

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color="#888" />
          <TextInput
            style={[styles.searchInput, isArabic && styles.arabicText]}
            placeholder={isArabic ? 'ابحث عن الأخبار...' : 'Search news...'}
            placeholderTextColor="#888"
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <FontAwesome name="times-circle" size={18} color="#888" />
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
          <FontAwesome name="search" size={48} color="#333" />
          <Text style={styles.emptyText}>
            {isArabic ? 'لا توجد نتائج' : 'No results found'}
          </Text>
          <Text style={styles.emptySubtext}>
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
              style={styles.resultCard}
              onPress={() => handleStoryPress(item.id)}
            >
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.resultImage} />
              )}
              <View style={styles.resultContent}>
                <Text
                  style={[styles.resultTitle, isArabic && styles.arabicText]}
                  numberOfLines={2}
                >
                  {isArabic ? item.title_ar : item.title_en}
                </Text>
                <Text style={styles.resultMeta}>
                  {item.source?.name} • {new Date(item.published_at || item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.content}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isArabic && styles.arabicText]}>
                  {isArabic ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                </Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearButton}>
                    {isArabic ? 'مسح' : 'Clear'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentSearches}>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchItem}
                    onPress={() => handleSearch(search)}
                  >
                    <FontAwesome name="history" size={14} color="#888" />
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Topics */}
          <Text style={[styles.sectionTitle, isArabic && styles.arabicText]}>
            {isArabic ? 'المواضيع' : 'Topics'}
          </Text>
          <View style={styles.topicsGrid}>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicCard, topic.color ? { backgroundColor: topic.color } : { backgroundColor: '#333' }]}
                onPress={() => handleTopicPress(topic)}
              >
                {topic.icon && <Text style={styles.topicIcon}>{topic.icon}</Text>}
                <Text style={styles.topicName}>
                  {isArabic ? topic.name_ar : topic.name_en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
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
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  recentSearches: {
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  recentSearchText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicCard: {
    width: '47%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicIcon: {
    fontSize: 24,
  },
  topicName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  resultImage: {
    width: 100,
    height: 80,
  },
  resultContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  resultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  resultMeta: {
    color: '#888',
    fontSize: 12,
  },
});
