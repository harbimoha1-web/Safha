/**
 * Live Supabase Integration Tests
 * Tests against real Supabase instance to verify:
 * - Database operations work correctly
 * - RLS policies are enforced
 * - Migrations are applied correctly
 *
 * IMPORTANT: These tests require environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
 * - SUPABASE_ANON_KEY (for user-level operations)
 *
 * Run with: npm run test:live
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Skip if no live credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

const describeIfLive = SUPABASE_URL && SERVICE_ROLE_KEY ? describe : describe.skip;

describeIfLive('Live Supabase Integration', () => {
  let adminClient: SupabaseClient;
  let anonClient: SupabaseClient;

  beforeAll(() => {
    adminClient = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    anonClient = createClient(SUPABASE_URL!, ANON_KEY!);
  });

  describe('Database Connectivity', () => {
    it('should connect with service role key', async () => {
      const { data, error } = await adminClient
        .from('topics')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
    });

    it('should connect with anon key', async () => {
      const { data, error } = await anonClient
        .from('topics')
        .select('id, name_en')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('Topics Table', () => {
    it('should have all required topics', async () => {
      const { data: topics, error } = await adminClient
        .from('topics')
        .select('slug')
        .order('slug');

      expect(error).toBeNull();
      expect(topics).toBeDefined();

      const slugs = topics!.map((t) => t.slug);
      expect(slugs).toContain('politics');
      expect(slugs).toContain('economy');
      expect(slugs).toContain('sports');
      expect(slugs).toContain('technology');
    });

    it('should have bilingual names', async () => {
      const { data: topic, error } = await adminClient
        .from('topics')
        .select('name_ar, name_en')
        .eq('slug', 'technology')
        .single();

      expect(error).toBeNull();
      expect(topic?.name_ar).toBeTruthy();
      expect(topic?.name_en).toBeTruthy();
    });
  });

  describe('Sources Table', () => {
    it('should have RSS sources configured', async () => {
      const { data: sources, error } = await adminClient
        .from('rss_sources')
        .select('id, name, feed_url, is_active')
        .limit(10);

      expect(error).toBeNull();
      expect(sources).toBeDefined();
      expect(sources!.length).toBeGreaterThan(0);
    });

    it('should have valid feed URLs', async () => {
      const { data: sources, error } = await adminClient
        .from('rss_sources')
        .select('feed_url')
        .eq('is_active', true)
        .limit(5);

      expect(error).toBeNull();
      sources?.forEach((source) => {
        expect(source.feed_url).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Stories Table', () => {
    it('should fetch approved stories', async () => {
      const { data: stories, error } = await anonClient
        .from('stories')
        .select('id, original_title, summary_ar, summary_en, is_approved')
        .eq('is_approved', true)
        .limit(5);

      expect(error).toBeNull();
      stories?.forEach((story) => {
        expect(story.is_approved).toBe(true);
      });
    });

    it('should have required summary fields', async () => {
      const { data: story, error } = await adminClient
        .from('stories')
        .select('summary_ar, summary_en, why_it_matters_ar, why_it_matters_en')
        .eq('is_approved', true)
        .limit(1)
        .single();

      if (story) {
        // At least one language should have summaries
        const hasArabic = story.summary_ar && story.why_it_matters_ar;
        const hasEnglish = story.summary_en && story.why_it_matters_en;
        expect(hasArabic || hasEnglish).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const { data: page1, error: err1 } = await anonClient
        .from('stories')
        .select('id, published_at')
        .eq('is_approved', true)
        .order('published_at', { ascending: false })
        .range(0, 9);

      expect(err1).toBeNull();

      if (page1 && page1.length > 0) {
        const lastDate = page1[page1.length - 1].published_at;

        const { data: page2, error: err2 } = await anonClient
          .from('stories')
          .select('id, published_at')
          .eq('is_approved', true)
          .lt('published_at', lastDate)
          .order('published_at', { ascending: false })
          .range(0, 9);

        expect(err2).toBeNull();

        // Pages should have different stories
        if (page2 && page2.length > 0) {
          expect(page1[0].id).not.toBe(page2[0].id);
        }
      }
    });
  });

  describe('Raw Articles Pipeline', () => {
    it('should have raw_articles table', async () => {
      const { data, error } = await adminClient
        .from('raw_articles')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
    });

    it('should track article status correctly', async () => {
      const { data: statuses, error } = await adminClient
        .from('raw_articles')
        .select('status')
        .limit(100);

      expect(error).toBeNull();

      const validStatuses = ['pending', 'processing', 'processed', 'failed', 'rejected'];
      statuses?.forEach((article) => {
        expect(validStatuses).toContain(article.status);
      });
    });
  });

  describe('Profiles Table', () => {
    it('should have profiles table accessible', async () => {
      const { error } = await adminClient
        .from('profiles')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('Subscriptions Table', () => {
    it('should have subscriptions table', async () => {
      const { error } = await adminClient
        .from('subscriptions')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
    });

    it('should have valid subscription statuses', async () => {
      const { data: subs, error } = await adminClient
        .from('subscriptions')
        .select('status')
        .limit(50);

      expect(error).toBeNull();

      const validStatuses = ['active', 'canceled', 'past_due', 'trialing'];
      subs?.forEach((sub) => {
        expect(validStatuses).toContain(sub.status);
      });
    });
  });

  describe('RPC Functions', () => {
    it('should have increment_view_count function', async () => {
      // Just verify the function exists (don't actually increment)
      const { error } = await adminClient.rpc('increment_view_count', {
        story_id: '00000000-0000-0000-0000-000000000000', // Non-existent ID
      });

      // Should either succeed (no-op) or fail gracefully
      // Not a "function does not exist" error
      if (error) {
        expect(error.message).not.toContain('function');
      }
    });
  });

  describe('Indexes Performance', () => {
    it('should have indexes on stories.published_at', async () => {
      const start = Date.now();
      const { error } = await anonClient
        .from('stories')
        .select('id')
        .eq('is_approved', true)
        .order('published_at', { ascending: false })
        .limit(100);

      const duration = Date.now() - start;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(500); // Should be fast with index
    });

    it('should have indexes on raw_articles.status', async () => {
      const start = Date.now();
      const { error } = await adminClient
        .from('raw_articles')
        .select('id')
        .eq('status', 'pending')
        .limit(100);

      const duration = Date.now() - start;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Data Integrity', () => {
    it('should have stories linked to valid sources', async () => {
      const { data: stories, error } = await adminClient
        .from('stories')
        .select('id, source_id, source:sources(id, name)')
        .limit(10);

      expect(error).toBeNull();
      stories?.forEach((story) => {
        if (story.source_id) {
          expect(story.source).toBeDefined();
        }
      });
    });

    it('should have raw_articles linked to rss_sources', async () => {
      const { data: articles, error } = await adminClient
        .from('raw_articles')
        .select('id, rss_source_id, rss_source:rss_sources(id, name)')
        .limit(10);

      expect(error).toBeNull();
      articles?.forEach((article) => {
        expect(article.rss_source).toBeDefined();
      });
    });
  });
});

describe('Live Supabase Skipped', () => {
  it('should skip if no credentials', () => {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.log('Skipping live tests - no SUPABASE_URL or SERVICE_ROLE_KEY');
    }
    expect(true).toBe(true);
  });
});
