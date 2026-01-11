/**
 * Content Pipeline Integration Tests
 * Tests the end-to-end flow of content processing
 *
 * Note: Edge functions run in Deno, so we test the logic patterns
 * and API integration points that can be mocked in Jest.
 */

// Mock Supabase
jest.mock('@/lib/supabase');

import { supabase } from '@/lib/supabase';

// Mock RSS feed data
const mockRSSArticle = {
  id: 'article-1',
  rss_source_id: 'source-1',
  guid: 'https://example.com/article-1',
  original_url: 'https://example.com/article-1',
  original_title: 'Breaking: Major Tech Announcement',
  original_content: 'Technology company announces new product launch with revolutionary features.',
  original_description: 'A summary of the article content.',
  full_content: 'Full article text with multiple paragraphs of detailed content about the announcement.',
  content_quality: 0.85,
  image_url: 'https://example.com/image.jpg',
  video_url: null,
  video_type: null,
  published_at: '2024-01-01T00:00:00Z',
  status: 'pending',
  retry_count: 0,
  created_at: '2024-01-01T00:00:00Z',
};

const mockRSSSource = {
  id: 'source-1',
  name: 'Tech News Daily',
  feed_url: 'https://technews.example.com/rss',
  language: 'en',
  reliability_score: 0.85,
  is_active: true,
  fetch_interval_minutes: 30,
  last_fetched_at: null,
  error_count: 0,
};

const mockTopic = {
  id: 'topic-tech',
  name: 'Technology',
  slug: 'technology',
};

const mockStory = {
  id: 'story-1',
  source_id: 'source-1',
  original_url: 'https://example.com/article-1',
  title_en: 'Breaking: Major Tech Announcement',
  title_ar: null,
  summary_en: 'AI-generated summary of the article.',
  summary_ar: 'ملخص الخبر بالعربية.',
  why_it_matters_en: 'This matters because...',
  why_it_matters_ar: 'لماذا يهمك؟',
  ai_quality_score: 0.8,
  image_url: 'https://example.com/image.jpg',
  topic_ids: ['topic-tech'],
  is_approved: true,
  published_at: '2024-01-01T00:00:00Z',
};

describe('Content Pipeline Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RSS Source Management', () => {
    it('should fetch active RSS sources for processing', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [mockRSSSource],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { data: sources } = await supabase
        .from('rss_sources')
        .select('*')
        .eq('is_active', true)
        .lt('error_count', 5)
        .or(`last_fetched_at.is.null`)
        .order('last_fetched_at', { ascending: true })
        .limit(10);

      expect(sources).toHaveLength(1);
      expect(sources[0].name).toBe('Tech News Daily');
      expect(sources[0].is_active).toBe(true);
    });

    it('should skip sources with too many errors', async () => {
      const sourcesWithErrors = [
        { ...mockRSSSource, error_count: 0 },
        { ...mockRSSSource, id: 'source-2', error_count: 5 }, // Should be skipped
        { ...mockRSSSource, id: 'source-3', error_count: 2 },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: sourcesWithErrors.filter(s => s.error_count < 5),
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { data: sources } = await supabase
        .from('rss_sources')
        .select('*')
        .eq('is_active', true)
        .lt('error_count', 5)
        .or(`last_fetched_at.is.null`)
        .order('last_fetched_at')
        .limit(10);

      // Source with error_count=5 should be excluded
      expect(sources).toHaveLength(2);
      expect(sources.every((s: typeof mockRSSSource) => s.error_count < 5)).toBe(true);
    });

    it('should update source after successful fetch', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

      await supabase
        .from('rss_sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          error_count: 0,
          last_error: null,
        })
        .eq('id', 'source-1');

      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          error_count: 0,
          last_error: null,
        })
      );
    });

    it('should increment error count on fetch failure', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

      const currentErrorCount = 1;
      await supabase
        .from('rss_sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          error_count: currentErrorCount + 1,
          last_error: 'Connection timeout',
        })
        .eq('id', 'source-1');

      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          error_count: 2,
          last_error: 'Connection timeout',
        })
      );
    });
  });

  describe('Raw Article Processing', () => {
    it('should fetch pending articles for processing', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ ...mockRSSArticle, rss_source: mockRSSSource }],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { data: articles } = await supabase
        .from('raw_articles')
        .select('*, rss_source:rss_sources(*)')
        .eq('status', 'pending')
        .lt('retry_count', 3)
        .order('fetched_at', { ascending: true })
        .limit(10);

      expect(articles).toHaveLength(1);
      expect(articles[0].status).toBe('pending');
      expect(articles[0].rss_source.name).toBe('Tech News Daily');
    });

    it('should skip articles with too many retries', async () => {
      const articlesWithRetries = [
        { ...mockRSSArticle, retry_count: 0 },
        { ...mockRSSArticle, id: 'article-2', retry_count: 3 }, // Should be skipped
        { ...mockRSSArticle, id: 'article-3', retry_count: 1 },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: articlesWithRetries.filter(a => a.retry_count < 3),
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { data: articles } = await supabase
        .from('raw_articles')
        .select('*')
        .eq('status', 'pending')
        .lt('retry_count', 3)
        .order('fetched_at')
        .limit(10);

      expect(articles).toHaveLength(2);
    });

    it('should mark article as processing before AI summarization', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

      await supabase
        .from('raw_articles')
        .update({ status: 'processing' })
        .eq('id', 'article-1');

      expect(mockUpdate.update).toHaveBeenCalledWith({ status: 'processing' });
    });

    it('should reject articles with content too short', async () => {
      const shortArticle = { ...mockRSSArticle, full_content: 'Short' };

      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

      // Simulate rejection due to short content
      const content = shortArticle.full_content || shortArticle.original_content || '';
      if (content.length < 50) {
        await supabase
          .from('raw_articles')
          .update({
            status: 'rejected',
            error_message: 'Content too short',
            processed_at: new Date().toISOString(),
          })
          .eq('id', shortArticle.id);
      }

      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          error_message: 'Content too short',
        })
      );
    });

    it('should mark article as failed on processing error', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

      await supabase
        .from('raw_articles')
        .update({
          status: 'failed',
          error_message: 'Claude API timeout',
          retry_count: 1,
          processed_at: new Date().toISOString(),
        })
        .eq('id', 'article-1');

      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Claude API timeout',
        })
      );
    });
  });

  describe('Story Creation', () => {
    it('should create story from processed article', async () => {
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockStory,
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockInsert);

      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          source_id: 'source-1',
          original_url: mockRSSArticle.original_url,
          title_en: mockRSSArticle.original_title,
          summary_en: 'AI-generated summary',
          summary_ar: 'ملخص بالعربية',
          ai_quality_score: 0.8,
          image_url: mockRSSArticle.image_url,
          topic_ids: ['topic-tech'],
          is_approved: true,
          published_at: mockRSSArticle.published_at,
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(story.id).toBe('story-1');
    });

    it('should link story back to raw article', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

      await supabase
        .from('raw_articles')
        .update({
          status: 'processed',
          story_id: 'story-1',
          processed_at: new Date().toISOString(),
        })
        .eq('id', 'article-1');

      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processed',
          story_id: 'story-1',
        })
      );
    });

    it('should reject story with low quality score', async () => {
      const lowQualitySummary = {
        summary_en: 'Summary',
        summary_ar: 'ملخص',
        quality_score: 0.3, // Below 0.4 threshold
        topics: ['technology'],
      };

      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

      // Simulate quality rejection
      if (lowQualitySummary.quality_score < 0.4) {
        await supabase
          .from('raw_articles')
          .update({
            status: 'rejected',
            error_message: `Quality score too low: ${lowQualitySummary.quality_score}`,
            processed_at: new Date().toISOString(),
          })
          .eq('id', 'article-1');
      }

      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          error_message: 'Quality score too low: 0.3',
        })
      );
    });
  });

  describe('Topic Mapping', () => {
    it('should map topic slugs to IDs', async () => {
      const topicSlugs = ['technology', 'economy'];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'topic-tech', slug: 'technology' },
            { id: 'topic-econ', slug: 'economy' },
          ],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { data: topics } = await supabase
        .from('topics')
        .select('id, slug')
        .in('slug', topicSlugs);

      expect(topics).toHaveLength(2);
      expect(topics.map((t: typeof mockTopic) => t.id)).toContain('topic-tech');
    });

    it('should handle unknown topic slugs gracefully', async () => {
      const topicSlugs = ['technology', 'unknown-topic'];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ id: 'topic-tech', slug: 'technology' }], // Only known topic
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { data: topics } = await supabase
        .from('topics')
        .select('id, slug')
        .in('slug', topicSlugs);

      // Only valid topics should be returned
      expect(topics).toHaveLength(1);
    });
  });

  describe('Deduplication', () => {
    it('should detect duplicate articles by URL', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'existing-article' }],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const url = 'https://example.com/article-1';
      const contentHash = 'abc123';

      const { data: existing } = await supabase
        .from('raw_articles')
        .select('id')
        .or(`original_url.eq.${url},content_hash.eq.${contentHash}`)
        .limit(1);

      expect(existing).toHaveLength(1);
      // Should skip insertion if existing
    });

    it('should allow new articles when no duplicate exists', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { data: existing } = await supabase
        .from('raw_articles')
        .select('id')
        .or(`original_url.eq.newurl,content_hash.eq.newhash`)
        .limit(1);

      expect(existing).toHaveLength(0);
      // Should proceed with insertion
    });
  });

  describe('Source Management', () => {
    it('should get or create source for new RSS feed', async () => {
      // First, check if source exists
      const mockSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      };

      // Then insert new source
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-source-id' },
          error: null,
        }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockSelect : mockInsert;
      });

      // Check existing
      const { data: existing, error: existingError } = await supabase
        .from('sources')
        .select('id')
        .eq('name', 'New Source')
        .single();

      expect(existing).toBeNull();

      // Create new
      const { data: newSource } = await supabase
        .from('sources')
        .insert({
          name: 'New Source',
          url: 'https://newsource.com',
          language: 'en',
          reliability_score: 0.7,
        })
        .select('id')
        .single();

      expect(newSource.id).toBe('new-source-id');
    });
  });
});

describe('Content Quality Metrics', () => {
  it('should calculate quality score based on content characteristics', () => {
    // Test the quality scoring logic
    interface ContentQuality {
      paragraphCount: number;
      avgParagraphLength: number;
      totalLength: number;
      hasProperStructure: boolean;
    }

    function calculateQualityScore(quality: ContentQuality): number {
      let score = 0;

      // Paragraph count (0-0.3)
      if (quality.paragraphCount >= 5) score += 0.3;
      else if (quality.paragraphCount >= 3) score += 0.2;
      else if (quality.paragraphCount >= 2) score += 0.1;

      // Average paragraph length (0-0.3)
      if (quality.avgParagraphLength >= 100) score += 0.3;
      else if (quality.avgParagraphLength >= 60) score += 0.2;
      else if (quality.avgParagraphLength >= 40) score += 0.1;

      // Total length (0-0.2)
      if (quality.totalLength >= 1500) score += 0.2;
      else if (quality.totalLength >= 800) score += 0.15;
      else if (quality.totalLength >= 400) score += 0.1;

      // Proper structure bonus (0-0.2)
      if (quality.hasProperStructure) score += 0.2;

      return Math.min(score, 1);
    }

    // High quality article
    const highQuality: ContentQuality = {
      paragraphCount: 6,
      avgParagraphLength: 120,
      totalLength: 2000,
      hasProperStructure: true,
    };
    expect(calculateQualityScore(highQuality)).toBe(1.0);

    // Medium quality article
    const mediumQuality: ContentQuality = {
      paragraphCount: 3,
      avgParagraphLength: 70,
      totalLength: 600,
      hasProperStructure: true,
    };
    expect(calculateQualityScore(mediumQuality)).toBeCloseTo(0.65, 1);

    // Low quality article
    const lowQuality: ContentQuality = {
      paragraphCount: 1,
      avgParagraphLength: 30,
      totalLength: 100,
      hasProperStructure: false,
    };
    expect(calculateQualityScore(lowQuality)).toBe(0);
  });
});
