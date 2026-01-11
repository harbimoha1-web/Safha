/**
 * Summary Store Tests
 * Tests daily digest generation and state management
 */

import { act } from '@testing-library/react';
import { useSummaryStore } from '@/stores/summary';
import type { Story } from '@/types';

// Mock stories for testing
const mockStories: Story[] = [
  {
    id: '1',
    title_en: 'Tech Company Announces New Product',
    title_ar: 'شركة تقنية تعلن عن منتج جديد',
    summary_en: 'A major tech company unveiled its latest product today.',
    summary_ar: 'كشفت شركة تقنية كبرى عن أحدث منتجاتها اليوم.',
    topic_ids: ['technology'],
    source: { id: 's1', name: 'Tech News', favicon: null },
    created_at: '2024-01-01T00:00:00Z',
    published_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title_en: 'Economy Shows Signs of Recovery',
    title_ar: 'الاقتصاد يظهر علامات انتعاش',
    summary_en: 'Economic indicators point to a recovery.',
    summary_ar: 'تشير المؤشرات الاقتصادية إلى انتعاش.',
    topic_ids: ['economy'],
    source: { id: 's2', name: 'Financial Times', favicon: null },
    created_at: '2024-01-01T01:00:00Z',
    published_at: '2024-01-01T01:00:00Z',
  },
  {
    id: '3',
    title_en: 'Sports Team Wins Championship',
    title_ar: 'فريق رياضي يفوز بالبطولة',
    summary_en: 'The team secured their championship victory.',
    summary_ar: 'حقق الفريق فوزه بالبطولة.',
    topic_ids: ['sports'],
    source: { id: 's3', name: 'Sports Daily', favicon: null },
    created_at: '2024-01-01T02:00:00Z',
    published_at: '2024-01-01T02:00:00Z',
  },
  {
    id: '4',
    title_en: 'Another Tech Story',
    title_ar: 'خبر تقني آخر',
    summary_en: 'More tech news coming in.',
    summary_ar: 'المزيد من أخبار التقنية.',
    topic_ids: ['technology'],
    source: { id: 's1', name: 'Tech News', favicon: null },
    created_at: '2024-01-01T03:00:00Z',
    published_at: '2024-01-01T03:00:00Z',
  },
  {
    id: '5',
    title_en: 'Story Without Topic',
    title_ar: 'خبر بدون موضوع',
    summary_en: 'A general news story.',
    summary_ar: 'خبر عام.',
    topic_ids: [],
    source: { id: 's4', name: 'General News', favicon: null },
    created_at: '2024-01-01T04:00:00Z',
    published_at: '2024-01-01T04:00:00Z',
  },
] as unknown as Story[];

describe('Summary Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSummaryStore.setState({
      summary: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSummaryStore.getState();
      expect(state.summary).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      act(() => {
        useSummaryStore.getState().setLoading(true);
      });

      expect(useSummaryStore.getState().isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      useSummaryStore.setState({ isLoading: true });

      act(() => {
        useSummaryStore.getState().setLoading(false);
      });

      expect(useSummaryStore.getState().isLoading).toBe(false);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary from stories in English', () => {
      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary).not.toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should generate summary from stories in Arabic', () => {
      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'ar');
      });

      const state = useSummaryStore.getState();
      expect(state.summary).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('should group stories by topic', () => {
      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary?.sections.length).toBeGreaterThan(0);

      // Find the technology section (should have 2 stories)
      const techSection = state.summary?.sections.find(s => s.topic === 'Technology');
      expect(techSection).toBeDefined();
      expect(techSection?.stories.length).toBe(2);
    });

    it('should use general category for stories without topics', () => {
      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });

      const state = useSummaryStore.getState();
      const generalSection = state.summary?.sections.find(
        s => s.topic === "Today's Headlines"
      );
      expect(generalSection).toBeDefined();
    });

    it('should calculate source attributions', () => {
      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary?.sourceAttributions).toBeDefined();
      expect(state.summary?.sourceAttributions.length).toBeGreaterThan(0);

      // Tech News should have 2 stories
      const techNewsAttribution = state.summary?.sourceAttributions.find(
        s => s.name === 'Tech News'
      );
      expect(techNewsAttribution?.storyCount).toBe(2);
    });

    it('should limit to 5 stories', () => {
      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary?.totalStories).toBeLessThanOrEqual(5);
    });

    it('should complete with loading false after generation', () => {
      // Start with loading true
      useSummaryStore.setState({ isLoading: true });

      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });

      // After generation completes, loading should be false
      expect(useSummaryStore.getState().isLoading).toBe(false);
      expect(useSummaryStore.getState().summary).not.toBeNull();
    });

    it('should include Arabic topic labels', () => {
      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'ar');
      });

      const state = useSummaryStore.getState();
      const techSection = state.summary?.sections.find(s => s.topic === 'Technology');
      expect(techSection?.topicAr).toBe('التكنولوجيا');
    });

    it('should handle stories with missing titles gracefully', () => {
      const storiesWithMissingData = [
        {
          id: '1',
          title_en: undefined,
          title_ar: undefined,
          summary_en: 'A summary',
          summary_ar: 'ملخص',
          topic_ids: ['technology'],
          source: { id: 's1', name: 'Source', favicon: null },
          created_at: '2024-01-01T00:00:00Z',
          published_at: '2024-01-01T00:00:00Z',
        },
      ] as unknown as Story[];

      act(() => {
        useSummaryStore.getState().generateSummary(storiesWithMissingData, 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary).not.toBeNull();
      expect(state.summary?.sections[0].stories[0].title).toBe('Untitled');
      expect(state.summary?.sections[0].stories[0].titleAr).toBe('بدون عنوان');
    });

    it('should handle stories with missing source gracefully', () => {
      const storiesWithMissingSource = [
        {
          id: '1',
          title_en: 'Title',
          title_ar: 'عنوان',
          summary_en: 'A summary',
          summary_ar: 'ملخص',
          topic_ids: ['technology'],
          source: undefined,
          created_at: '2024-01-01T00:00:00Z',
          published_at: '2024-01-01T00:00:00Z',
        },
      ] as unknown as Story[];

      act(() => {
        useSummaryStore.getState().generateSummary(storiesWithMissingSource, 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary).not.toBeNull();
      expect(state.summary?.sections[0].stories[0].source).toBe('News');
    });

    it('should generate unique summary IDs', () => {
      const originalNow = Date.now;
      let time = 1000000;
      Date.now = jest.fn(() => time++);

      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });
      const firstId = useSummaryStore.getState().summary?.id;

      act(() => {
        useSummaryStore.getState().generateSummary(mockStories, 'en');
      });
      const secondId = useSummaryStore.getState().summary?.id;

      expect(firstId).not.toBe(secondId);
      Date.now = originalNow;
    });

    it('should handle empty stories array', () => {
      act(() => {
        useSummaryStore.getState().generateSummary([], 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary).not.toBeNull();
      expect(state.summary?.sections).toEqual([]);
      expect(state.summary?.totalStories).toBe(0);
    });

    it('should map unknown topic IDs to general', () => {
      const storiesWithUnknownTopic = [
        {
          id: '1',
          title_en: 'Title',
          title_ar: 'عنوان',
          summary_en: 'Summary',
          summary_ar: 'ملخص',
          topic_ids: ['unknown-topic-xyz'],
          source: { id: 's1', name: 'Source', favicon: null },
          created_at: '2024-01-01T00:00:00Z',
          published_at: '2024-01-01T00:00:00Z',
        },
      ] as unknown as Story[];

      act(() => {
        useSummaryStore.getState().generateSummary(storiesWithUnknownTopic, 'en');
      });

      const state = useSummaryStore.getState();
      expect(state.summary?.sections[0].topic).toBe("Today's Headlines");
    });
  });

  describe('clearSummary', () => {
    it('should clear summary and error', () => {
      // Set some state first
      useSummaryStore.setState({
        summary: {
          id: 'test',
          generatedAt: '2024-01-01T00:00:00Z',
          sections: [],
          sourceAttributions: [],
          totalStories: 0,
        },
        error: 'Some error',
      });

      act(() => {
        useSummaryStore.getState().clearSummary();
      });

      const state = useSummaryStore.getState();
      expect(state.summary).toBeNull();
      expect(state.error).toBeNull();
    });
  });
});
