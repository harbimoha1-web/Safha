import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore, useAuthStore } from '@/stores';
import { getTopics } from '@/lib/api';
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isArabic ? 'اختر اهتماماتك' : 'Choose Your Interests'}
        </Text>
        <Text style={styles.subtitle}>
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
          return (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicCard,
                topic.color && { borderColor: topic.color },
                isSelected && topic.color && { backgroundColor: topic.color },
              ]}
              onPress={() => toggleTopic(topic.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <Text
                style={[
                  styles.topicName,
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
      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedIds.size} / 3{' '}
          {isArabic ? 'مواضيع محددة' : 'topics selected'}
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedIds.size < 3 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedIds.size < 3 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>
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
    backgroundColor: '#000',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  topicCard: {
    width: '47%',
    aspectRatio: 1.5,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  topicIcon: {
    fontSize: 32,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  topicNameSelected: {
    color: '#000',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  selectedCount: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#333',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
