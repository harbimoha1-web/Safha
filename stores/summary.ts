// Daily Summary Store
// Manages unified AI-generated daily digest (Premium feature)

import { create } from 'zustand';
import type { Story } from '@/types';
import { createLogger } from '@/lib/debug';

const log = createLogger('SummaryStore');

interface TopicSection {
  topic: string;
  topicAr: string;
  stories: {
    id: string;
    title: string;
    titleAr: string;
    summary: string;
    summaryAr: string;
    source: string;
  }[];
}

interface SourceAttribution {
  name: string;
  storyCount: number;
}

interface UnifiedDailySummary {
  id: string;
  generatedAt: string;
  sections: TopicSection[];
  sourceAttributions: SourceAttribution[];
  totalStories: number;
}

interface SummaryState {
  summary: UnifiedDailySummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  generateSummary: (stories: Story[], language: 'ar' | 'en') => void;
  clearSummary: () => void;
}

// Topic labels for categorization
const TOPIC_LABELS: Record<string, { en: string; ar: string }> = {
  // Core topics
  politics: { en: 'Politics', ar: 'السياسة' },
  economy: { en: 'Economy', ar: 'الاقتصاد' },
  technology: { en: 'Technology', ar: 'التكنولوجيا' },
  // New topics
  'food-drink': { en: 'Food & Drink', ar: 'الطعام والمشروبات' },
  'beauty-style': { en: 'Beauty & Style', ar: 'الجمال والأناقة' },
  music: { en: 'Music', ar: 'الموسيقى' },
  'fitness-health': { en: 'Fitness & Health', ar: 'اللياقة والصحة' },
  vlogs: { en: 'Vlogs', ar: 'فلوقات' },
  comedy: { en: 'Comedy', ar: 'كوميديا' },
  sports: { en: 'Sports', ar: 'الرياضة' },
  'entertainment-culture': { en: 'Entertainment Culture', ar: 'الثقافة الترفيهية' },
  'science-education': { en: 'Science & Education', ar: 'العلوم والتعليم' },
  family: { en: 'Family', ar: 'العائلة' },
  'motivation-advice': { en: 'Motivation & Advice', ar: 'التحفيز والنصائح' },
  dance: { en: 'Dance', ar: 'الرقص' },
  travel: { en: 'Travel', ar: 'السفر' },
  gaming: { en: 'Gaming', ar: 'الألعاب' },
  pets: { en: 'Pets', ar: 'الحيوانات الأليفة' },
  'auto-vehicle': { en: 'Auto & Vehicle', ar: 'السيارات والمركبات' },
  diy: { en: 'DIY', ar: 'افعلها بنفسك' },
  art: { en: 'Art', ar: 'الفن' },
  'anime-comics': { en: 'Anime & Comics', ar: 'الأنمي والقصص المصورة' },
  'life-hacks': { en: 'Life Hacks', ar: 'حيل الحياة' },
  outdoors: { en: 'Outdoors', ar: 'الطبيعة' },
  'oddly-satisfying': { en: 'Oddly Satisfying', ar: 'مرضي بشكل غريب' },
  'home-garden': { en: 'Home & Garden', ar: 'المنزل والحديقة' },
  // Legacy mappings
  health: { en: 'Health', ar: 'الصحة' },
  entertainment: { en: 'Entertainment', ar: 'الترفيه' },
  science: { en: 'Science', ar: 'العلوم' },
  general: { en: 'Today\'s Headlines', ar: 'عناوين اليوم' },
};

export const useSummaryStore = create<SummaryState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  generateSummary: (stories: Story[], language: 'ar' | 'en') => {
    set({ isLoading: true, error: null });

    try {
      const topStories = stories.slice(0, 5);

      // Group stories by topic
      const topicGroups = new Map<string, Story[]>();
      topStories.forEach((story) => {
        // Get first topic or use 'general'
        const topicId = story.topic_ids?.[0] || 'general';
        const topic = TOPIC_LABELS[topicId] ? topicId : 'general';

        if (!topicGroups.has(topic)) {
          topicGroups.set(topic, []);
        }
        topicGroups.get(topic)!.push(story);
      });

      // Build sections
      const sections: TopicSection[] = [];
      topicGroups.forEach((groupStories, topicId) => {
        const label = TOPIC_LABELS[topicId] || TOPIC_LABELS.general;
        sections.push({
          topic: label.en,
          topicAr: label.ar,
          stories: groupStories.map((s) => ({
            id: s.id,
            title: s.title_en || 'Untitled',
            titleAr: s.title_ar || 'بدون عنوان',
            summary: s.summary_en || '',
            summaryAr: s.summary_ar || '',
            source: s.source?.name || 'News',
          })),
        });
      });

      // Build source attributions
      const sourceMap = new Map<string, number>();
      topStories.forEach((s) => {
        const name = s.source?.name || 'Unknown';
        sourceMap.set(name, (sourceMap.get(name) || 0) + 1);
      });

      const sourceAttributions: SourceAttribution[] = Array.from(sourceMap.entries()).map(
        ([name, count]) => ({ name, storyCount: count })
      );

      const summary: UnifiedDailySummary = {
        id: `summary-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        sections,
        sourceAttributions,
        totalStories: topStories.length,
      };

      set({ summary, isLoading: false });
    } catch (error) {
      log.error('Summary generation error:', error);
      set({
        error:
          language === 'ar'
            ? 'فشل في إنشاء الملخص'
            : 'Failed to generate summary',
        isLoading: false,
      });
    }
  },

  clearSummary: () => {
    set({ summary: null, error: null });
  },
}));
