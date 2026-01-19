import { supabase } from './supabase';
import type { Story, Topic, Source, Profile, SavedStory, Note, BlockedSource, TopicSourceMapping, ContentLanguage } from '@/types';
import {
  StoryQuerySchema,
  SearchQuerySchema,
  StoryIdSchema,
  UserIdSchema,
  ProfileUpdateSchema,
  InteractionTypeSchema,
  escapeSqlWildcards,
  validateInput,
  ValidationError,
} from './validators';
import { createLogger } from './debug';

const log = createLogger('API');

// Custom API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Story select query (reusable)
const STORY_SELECT = `
  *,
  source:sources(*)
` as const;

// Stories API
export async function getStories(
  limit = 20,
  offset = 0,
  topicIds?: string[],
  blockedSourceIds?: string[],
  contentLanguage?: ContentLanguage
): Promise<Story[]> {
  // Validate inputs
  const validated = validateInput(StoryQuerySchema, { limit, offset, topicIds });

  // Use inner join when filtering by language to ensure source exists
  const selectQuery = contentLanguage && contentLanguage !== 'all'
    ? '*, source:sources!inner(*)'
    : STORY_SELECT;

  let query = supabase
    .from('stories')
    .select(selectQuery)
    .eq('is_approved', true)  // Only show approved stories
    .order('published_at', { ascending: false })  // Newest published articles first (Jan 14 → Jan 13 → Jan 12)
    .order('created_at', { ascending: false });  // Tiebreaker

  // Filter by source language if specified
  if (contentLanguage && contentLanguage !== 'all') {
    query = query.eq('source.language', contentLanguage);
  }

  // Filter by topics if provided
  if (validated.topicIds && validated.topicIds.length > 0) {
    query = query.overlaps('topic_ids', validated.topicIds);
  }

  // Filter out blocked sources (with UUID validation to prevent injection)
  if (blockedSourceIds && blockedSourceIds.length > 0) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validBlockedIds = blockedSourceIds.filter(id => UUID_REGEX.test(id));
    if (validBlockedIds.length > 0) {
      query = query.not('source_id', 'in', `(${validBlockedIds.join(',')})`);
    }
  }

  const { data, error } = await query.range(
    validated.offset,
    validated.offset + validated.limit - 1
  );

  if (error) {
    throw new APIError(`Failed to fetch stories: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Get unseen stories (server-side filtering via RPC)
// Filters out stories the user has already viewed or skipped
export async function getUnseenStories(
  userId: string,
  limit = 20,
  offset = 0,
  topicIds?: string[],
  blockedSourceIds?: string[],
  contentLanguage?: ContentLanguage
): Promise<Story[]> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validated = validateInput(StoryQuerySchema, { limit, offset, topicIds });

  const { data, error } = await supabase.rpc('get_unseen_stories', {
    p_user_id: validUserId,
    p_limit: validated.limit,
    p_offset: validated.offset,
    p_topic_ids: validated.topicIds || null,
    p_blocked_source_ids: blockedSourceIds || null,
  });

  log.debug('[getUnseenStories] RPC params:', { userId: validUserId, limit: validated.limit, offset: validated.offset, topicIds: validated.topicIds, contentLanguage });
  log.debug('[getUnseenStories] RPC returned:', data?.length ?? 0, 'stories, error:', error?.message ?? 'none');

  if (error) {
    // Fallback to regular getStories if RPC doesn't exist yet
    if (error.code === 'PGRST202' || error.message?.includes('function')) {
      log.warn('get_unseen_stories RPC not available, falling back to getStories');
      return getStories(limit, offset, topicIds, blockedSourceIds, contentLanguage);
    }
    throw new APIError(`Failed to fetch unseen stories: ${error.message}`, 500, error.code);
  }

  // RPC returns raw stories without source relation, fetch with sources
  if (data && data.length > 0) {
    const storyIds = data.map((s: Story) => s.id);
    const { data: storiesWithSources } = await supabase
      .from('stories')
      .select(STORY_SELECT)
      .in('id', storyIds);

    log.debug('[getUnseenStories] Fetched with sources:', storiesWithSources?.length ?? 0);

    if (storiesWithSources) {
      // Preserve order from RPC results
      const storyMap = new Map(storiesWithSources.map((s) => [s.id, s]));
      let stories = data.map((s: Story) => storyMap.get(s.id) || s);

      // Filter by content language if specified (include stories with missing source)
      if (contentLanguage && contentLanguage !== 'all') {
        const beforeFilter = stories.length;
        stories = stories.filter((s: Story) => !s.source || s.source.language === contentLanguage);
        log.debug('[getUnseenStories] Language filter:', beforeFilter, '->', stories.length);
      }

      log.debug('[getUnseenStories] Returning:', stories.length, 'stories');
      return stories;
    }
  }

  // No unseen stories available - return empty, let UI show "caught up" state
  log.debug('[getUnseenStories] No unseen stories available');
  return [];
}

// Get count of new stories since a timestamp (for "X new stories" badge)
export async function getNewStoryCount(
  userId: string,
  since: string,
  topicIds?: string[]
): Promise<number> {
  const validUserId = validateInput(UserIdSchema, userId);

  const { data, error } = await supabase.rpc('get_new_story_count', {
    p_user_id: validUserId,
    p_since: since,
    p_topic_ids: topicIds || null,
  });

  if (error) {
    // Return 0 if RPC doesn't exist yet
    if (error.code === 'PGRST202' || error.message?.includes('function')) {
      log.warn('get_new_story_count RPC not available');
      return 0;
    }
    throw new APIError(`Failed to get new story count: ${error.message}`, 500, error.code);
  }

  return data || 0;
}

// Reset user's feed history (clear view/skip interactions)
// Used when user has "caught up" and wants to see stories again
export async function resetFeedHistory(userId: string): Promise<void> {
  const validUserId = validateInput(UserIdSchema, userId);

  const { error } = await supabase
    .from('user_story_interactions')
    .delete()
    .eq('user_id', validUserId)
    .in('interaction_type', ['view', 'skip']);

  if (error) {
    throw new APIError(`Failed to reset feed history: ${error.message}`, 500, error.code);
  }
}

export async function getStoryById(id: string): Promise<Story | null> {
  // Validate ID
  const validId = validateInput(StoryIdSchema, id);

  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('id', validId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new APIError(`Failed to fetch story: ${error.message}`, 500, error.code);
  }
  return data;
}

// Fetch content on-demand for stories without full_content
// Uses direct fetch with retry logic for cold start resilience
export async function fetchStoryContent(
  storyId: string,
  originalUrl: string
): Promise<{ content: string | null; quality: number }> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Supabase config missing');
    return { content: null, quality: 0 };
  }

  // Get the current session's access token for authenticated requests
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || supabaseAnonKey;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/fetch-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ story_id: storyId, url: originalUrl }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Retry on 502/503/504 errors (cold start / transient)
      if (response.status >= 502 && response.status <= 504) {
        log.debug(`Fetch attempt ${attempt} failed with ${response.status}, retrying...`);
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 1000));
          continue;
        }
        return { content: null, quality: 0 };
      }

      if (!response.ok) {
        const errorText = await response.text();
        log.error('Fetch content error:', response.status, errorText);
        return { content: null, quality: 0 };
      }

      const data = await response.json();

      if (data?.success && data.content) {
        if (attempt > 1) {
          log.debug(`Fetch succeeded on attempt ${attempt}`);
        }
        return { content: data.content, quality: data.quality || 0 };
      }

      if (data && !data.success) {
        log.debug('Content extraction failed:', data?.method, data?.error);
      }

      return { content: null, quality: 0 };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.name === 'AbortError') {
        log.debug(`Fetch attempt ${attempt} timed out`);
      } else {
        log.debug(`Fetch attempt ${attempt} error:`, lastError.message);
      }

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        continue;
      }
    }
  }

  log.error('All fetch attempts failed:', lastError);
  return { content: null, quality: 0 };
}

export async function getStoriesByTopic(
  topicId: string,
  limit = 20
): Promise<Story[]> {
  // Validate inputs
  const validTopicId = validateInput(StoryIdSchema, topicId);
  const validLimit = Math.min(Math.max(1, limit), 100);

  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .contains('topic_ids', [validTopicId])
    .order('created_at', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(validLimit);

  if (error) {
    throw new APIError(`Failed to fetch stories by topic: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Topics API
export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    throw new APIError(`Failed to fetch topics: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Sources API
export async function getSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new APIError(`Failed to fetch sources: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Profile API
export async function getProfile(userId: string): Promise<Profile | null> {
  const validUserId = validateInput(UserIdSchema, userId);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', validUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new APIError(`Failed to fetch profile: ${error.message}`, 500, error.code);
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validUpdates = validateInput(ProfileUpdateSchema, updates);

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...validUpdates, updated_at: new Date().toISOString() })
    .eq('id', validUserId)
    .select()
    .single();

  if (error) {
    throw new APIError(`Failed to update profile: ${error.message}`, 500, error.code);
  }
  return data;
}

// Saved Stories API
export async function getSavedStories(userId: string): Promise<SavedStory[]> {
  const validUserId = validateInput(UserIdSchema, userId);

  const { data, error } = await supabase
    .from('saved_stories')
    .select(`
      *,
      story:stories(
        *,
        source:sources(*)
      )
    `)
    .eq('user_id', validUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new APIError(`Failed to fetch saved stories: ${error.message}`, 500, error.code);
  }
  return data || [];
}

export async function saveStory(
  userId: string,
  storyId: string
): Promise<SavedStory> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validStoryId = validateInput(StoryIdSchema, storyId);

  const { data, error } = await supabase
    .from('saved_stories')
    .insert({ user_id: validUserId, story_id: validStoryId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new APIError('Story already saved', 409, 'ALREADY_SAVED');
    }
    throw new APIError(`Failed to save story: ${error.message}`, 500, error.code);
  }
  return data;
}

export async function unsaveStory(userId: string, storyId: string): Promise<void> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validStoryId = validateInput(StoryIdSchema, storyId);

  const { error } = await supabase
    .from('saved_stories')
    .delete()
    .eq('user_id', validUserId)
    .eq('story_id', validStoryId);

  if (error) {
    throw new APIError(`Failed to unsave story: ${error.message}`, 500, error.code);
  }
}

export async function isStorySaved(
  userId: string,
  storyId: string
): Promise<boolean> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validStoryId = validateInput(StoryIdSchema, storyId);

  const { count, error } = await supabase
    .from('saved_stories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', validUserId)
    .eq('story_id', validStoryId);

  if (error) {
    throw new APIError(`Failed to check saved status: ${error.message}`, 500, error.code);
  }
  return (count ?? 0) > 0;
}

// Notes API
export async function getNotes(userId: string): Promise<Note[]> {
  const validUserId = validateInput(UserIdSchema, userId);

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      story:stories(
        *,
        source:sources(*)
      )
    `)
    .eq('user_id', validUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new APIError(`Failed to fetch notes: ${error.message}`, 500, error.code);
  }
  return data || [];
}

export async function createNote(
  userId: string,
  storyId: string,
  content: string
): Promise<Note> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validStoryId = validateInput(StoryIdSchema, storyId);

  // Premium check: Notes require subscription
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', validUserId)
    .single();

  const isPremium = subData &&
    (subData.plan === 'premium' || subData.plan === 'premium_annual') &&
    (subData.status === 'active' || subData.status === 'trialing') &&
    (!subData.current_period_end || new Date(subData.current_period_end) > new Date());

  if (!isPremium) {
    throw new APIError('Notes require صفحة+ subscription', 403, 'PREMIUM_REQUIRED');
  }

  if (!content || content.trim().length === 0) {
    throw new APIError('Note content cannot be empty', 400, 'EMPTY_CONTENT');
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: validUserId,
      story_id: validStoryId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    throw new APIError(`Failed to create note: ${error.message}`, 500, error.code);
  }
  return data;
}

export async function updateNote(
  noteId: string,
  content: string
): Promise<Note> {
  const validNoteId = validateInput(StoryIdSchema, noteId);

  if (!content || content.trim().length === 0) {
    throw new APIError('Note content cannot be empty', 400, 'EMPTY_CONTENT');
  }

  const { data, error } = await supabase
    .from('notes')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', validNoteId)
    .select()
    .single();

  if (error) {
    throw new APIError(`Failed to update note: ${error.message}`, 500, error.code);
  }
  return data;
}

export async function deleteNote(noteId: string): Promise<void> {
  const validNoteId = validateInput(StoryIdSchema, noteId);

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', validNoteId);

  if (error) {
    throw new APIError(`Failed to delete note: ${error.message}`, 500, error.code);
  }
}

// Interactions API
export async function recordInteraction(
  userId: string,
  storyId: string,
  type: 'view' | 'save' | 'share' | 'skip'
): Promise<void> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validStoryId = validateInput(StoryIdSchema, storyId);
  const validType = validateInput(InteractionTypeSchema, type);

  const { error } = await supabase
    .from('user_story_interactions')
    .upsert(
      {
        user_id: validUserId,
        story_id: validStoryId,
        interaction_type: validType,
      },
      {
        onConflict: 'user_id,story_id,interaction_type',
        ignoreDuplicates: true,
      }
    );

  // Ignore duplicate key errors (23505) - they're expected with the unique constraint
  if (error && error.code !== '23505') {
    throw new APIError(`Failed to record interaction: ${error.message}`, 500, error.code);
  }
}

// Reading History API
export async function getViewedStories(
  userId: string,
  limit = 50
): Promise<Story[]> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validLimit = Math.min(Math.max(1, limit), 100);

  const { data, error } = await supabase
    .from('user_story_interactions')
    .select(`
      story:stories(
        *,
        source:sources(*)
      )
    `)
    .eq('user_id', validUserId)
    .eq('interaction_type', 'view')
    .order('created_at', { ascending: false })
    .limit(validLimit);

  if (error) {
    throw new APIError(`Failed to fetch viewed stories: ${error.message}`, 500, error.code);
  }

  // Extract stories from the nested response
  const items = data as unknown as Array<{ story: Story }> | null;
  return (items || []).map((item) => item.story).filter(Boolean);
}

// Search API - PROTECTED against SQL injection
export async function searchStories(
  query: string,
  limit = 20
): Promise<Story[]> {
  // Validate and sanitize search query
  const validQuery = validateInput(SearchQuerySchema, query);
  const validLimit = Math.min(Math.max(1, limit), 100);

  try {
    // Use the fuzzy search RPC function (with pg_trgm for partial/typo matching)
    const { data, error } = await supabase.rpc('search_stories_v2', {
      search_query: validQuery,
      result_limit: validLimit,
    });

    if (error) {
      // Fallback to exact match if RPC fails (e.g., function doesn't exist yet)
      log.warn('Fuzzy search failed, falling back to exact match:', error.message);
      return searchStoriesExact(validQuery, validLimit);
    }

    // The RPC returns stories without the source relation, so we need to fetch sources
    if (data && data.length > 0) {
      const storyIds = data.map((s: Story) => s.id);
      const { data: storiesWithSources } = await supabase
        .from('stories')
        .select(STORY_SELECT)
        .in('id', storyIds);

      // Preserve the order from the RPC results
      if (storiesWithSources) {
        const storyMap = new Map(storiesWithSources.map((s) => [s.id, s]));
        return data.map((s: Story) => storyMap.get(s.id) || s);
      }
    }

    return data || [];
  } catch (err) {
    // Fallback to exact match on any error
    log.warn('Search error, falling back to exact match:', err);
    return searchStoriesExact(validQuery, validLimit);
  }
}

// Fallback exact match search (used if fuzzy search RPC is unavailable)
async function searchStoriesExact(query: string, limit: number): Promise<Story[]> {
  const escapedQuery = escapeSqlWildcards(query);

  // Search by title (both languages for backwards compatibility) and Arabic summary only
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .or(
      `title_ar.ilike.%${escapedQuery}%,` +
        `title_en.ilike.%${escapedQuery}%,` +
        `summary_ar.ilike.%${escapedQuery}%`
    )
    .order('created_at', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new APIError(`Search failed: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Daily Summary API - Get top stories for AI summary
export async function getDailySummaryStories(
  topicIds?: string[],
  limit = 5
): Promise<Story[]> {
  const validLimit = Math.min(Math.max(1, limit), 10);

  let query = supabase
    .from('stories')
    .select(STORY_SELECT)
    .order('created_at', { ascending: false })
    .order('published_at', { ascending: false });

  // Filter by topics if provided
  if (topicIds && topicIds.length > 0) {
    query = query.overlaps('topic_ids', topicIds);
  }

  const { data, error } = await query.limit(validLimit);

  if (error) {
    // Handle missing table gracefully for demo mode
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      log.debug('Demo mode: Using sample stories for summary');
      return [];
    }
    throw new APIError(`Failed to fetch summary stories: ${error.message}`, 500, error.code);
  }

  return data || [];
}

// Blocked Sources API
export async function getBlockedSources(userId: string): Promise<BlockedSource[]> {
  const validUserId = validateInput(UserIdSchema, userId);

  const { data, error } = await supabase
    .from('blocked_sources')
    .select(`
      *,
      source:sources(*)
    `)
    .eq('user_id', validUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new APIError(`Failed to fetch blocked sources: ${error.message}`, 500, error.code);
  }
  return data || [];
}

export async function getBlockedSourceIds(userId: string): Promise<string[]> {
  const validUserId = validateInput(UserIdSchema, userId);

  const { data, error } = await supabase
    .from('blocked_sources')
    .select('source_id')
    .eq('user_id', validUserId);

  if (error) {
    throw new APIError(`Failed to fetch blocked source IDs: ${error.message}`, 500, error.code);
  }
  return (data || []).map(item => item.source_id);
}

export async function blockSource(
  userId: string,
  sourceId: string
): Promise<BlockedSource> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validSourceId = validateInput(StoryIdSchema, sourceId);

  const { data, error } = await supabase
    .from('blocked_sources')
    .insert({ user_id: validUserId, source_id: validSourceId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new APIError('Source already blocked', 409, 'ALREADY_BLOCKED');
    }
    throw new APIError(`Failed to block source: ${error.message}`, 500, error.code);
  }
  return data;
}

export async function unblockSource(userId: string, sourceId: string): Promise<void> {
  const validUserId = validateInput(UserIdSchema, userId);
  const validSourceId = validateInput(StoryIdSchema, sourceId);

  const { error } = await supabase
    .from('blocked_sources')
    .delete()
    .eq('user_id', validUserId)
    .eq('source_id', validSourceId);

  if (error) {
    throw new APIError(`Failed to unblock source: ${error.message}`, 500, error.code);
  }
}

// Topic-Source Mapping API
export async function getTopicSourceMapping(): Promise<TopicSourceMapping[]> {
  const { data, error } = await supabase.rpc('get_topic_source_mapping');

  if (error) {
    // Handle missing function gracefully for development
    if (error.code === 'PGRST202' || error.message?.includes('function')) {
      log.debug('Topic-source mapping function not available, returning empty');
      return [];
    }
    throw new APIError(`Failed to fetch topic-source mapping: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

// Get all sources (including inactive) for admin
export async function getAllSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('name');

  if (error) {
    throw new APIError(`Failed to fetch all sources: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Update source (admin) - handles partial updates
export async function updateSource(sourceData: Partial<Source>): Promise<Source> {
  if (!sourceData.id) {
    throw new APIError('Source ID is required', 400, 'MISSING_ID');
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (sourceData.name !== undefined) updateData.name = sourceData.name;
  if (sourceData.url !== undefined) updateData.url = sourceData.url;
  if (sourceData.logo_url !== undefined) updateData.logo_url = sourceData.logo_url;
  if (sourceData.is_active !== undefined) updateData.is_active = sourceData.is_active;

  const { data, error } = await supabase
    .from('sources')
    .update(updateData)
    .eq('id', sourceData.id)
    .select()
    .single();

  if (error) {
    throw new APIError(`Failed to update source: ${error.message}`, 500, error.code);
  }
  return data;
}

// Get source-topic assignments for admin
export async function getSourceTopics(): Promise<{ source_id: string; topic_ids: string[] }[]> {
  const { data, error } = await supabase
    .from('source_topics')
    .select('source_id, topic_id');

  if (error) {
    // Return empty if table doesn't exist yet
    if (error.code === 'PGRST204' || error.message?.includes('does not exist')) {
      return [];
    }
    throw new APIError(`Failed to fetch source topics: ${error.message}`, 500, error.code);
  }

  // Group by source_id
  const grouped = (data || []).reduce((acc: Record<string, string[]>, item) => {
    if (!acc[item.source_id]) {
      acc[item.source_id] = [];
    }
    acc[item.source_id].push(item.topic_id);
    return acc;
  }, {});

  return Object.entries(grouped).map(([source_id, topic_ids]) => ({
    source_id,
    topic_ids,
  }));
}

// Update source-topic assignments (admin)
export async function updateSourceTopics(
  sourceId: string,
  topicIds: string[]
): Promise<void> {
  // Delete existing assignments
  const { error: deleteError } = await supabase
    .from('source_topics')
    .delete()
    .eq('source_id', sourceId);

  if (deleteError && deleteError.code !== 'PGRST204') {
    throw new APIError(`Failed to clear source topics: ${deleteError.message}`, 500, deleteError.code);
  }

  // Insert new assignments
  if (topicIds.length > 0) {
    const insertData = topicIds.map((topicId) => ({
      source_id: sourceId,
      topic_id: topicId,
    }));

    const { error: insertError } = await supabase
      .from('source_topics')
      .insert(insertData);

    if (insertError) {
      throw new APIError(`Failed to update source topics: ${insertError.message}`, 500, insertError.code);
    }
  }
}

// ============================================
// ADMIN ANALYTICS API
// ============================================

export interface AdminDashboardStatsResponse {
  total_users: number;
  premium_users: number;
  users_today: number;
  active_users_daily: number;
  active_users_weekly: number;
  active_users_monthly: number;
  total_stories: number;
  stories_today: number;
  pending_stories: number;
  total_sources: number;
  active_sources: number;
  total_topics: number;
  active_topics: number;
}

export interface TopStory {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  original_title: string | null;
  image_url: string | null;
  source_name: string | null;
  view_count: number;
  save_count: number;
  share_count: number;
  engagement_score: number;
  published_at: string | null;
}

export interface SourcePerformance {
  source_id: string;
  source_name: string;
  logo_url: string | null;
  language: string;
  is_active: boolean;
  story_count: number;
  total_views: number;
  total_saves: number;
  total_shares: number;
  avg_engagement: number;
}

export interface EngagementTrend {
  date: string;
  active_users: number;
  views: number;
  saves: number;
  shares: number;
  new_users: number;
}

export interface SourceStoryCount {
  source_id: string;
  story_count: number;
  stories_this_week: number;
}

export interface ApiCostByModel {
  model: string;
  cost: number;
  requests: number;
  input_tokens: number;
  output_tokens: number;
}

export interface ApiCostByFunction {
  function_name: string;
  cost: number;
  requests: number;
}

export interface ApiCostDaily {
  date: string;
  cost: number;
  requests: number;
  input_tokens: number;
  output_tokens: number;
}

export interface ApiCostSummary {
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_requests: number;
  avg_cost_per_request: number;
  by_model: ApiCostByModel[];
  by_function: ApiCostByFunction[];
  daily_costs: ApiCostDaily[];
  budget_usd: number;
  days: number;
}

// Get admin dashboard stats
export async function getAdminDashboardStats(): Promise<AdminDashboardStatsResponse> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

  if (error) {
    throw new APIError(`Failed to fetch dashboard stats: ${error.message}`, 500, error.code);
  }
  return data;
}

// Get top stories by engagement
export async function getTopStoriesByEngagement(
  limit = 10,
  days = 7
): Promise<TopStory[]> {
  const { data, error } = await supabase.rpc('get_top_stories_by_engagement', {
    p_limit: limit,
    p_days: days,
  });

  if (error) {
    throw new APIError(`Failed to fetch top stories: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Get source performance
export async function getSourcePerformance(
  limit = 20,
  days = 30
): Promise<SourcePerformance[]> {
  const { data, error } = await supabase.rpc('get_source_performance', {
    p_limit: limit,
    p_days: days,
  });

  if (error) {
    throw new APIError(`Failed to fetch source performance: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Get engagement trends
export async function getEngagementTrends(days = 14): Promise<EngagementTrend[]> {
  const { data, error } = await supabase.rpc('get_engagement_trends', {
    p_days: days,
  });

  if (error) {
    throw new APIError(`Failed to fetch engagement trends: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Get API cost summary for admin dashboard
export async function getApiCostSummary(days = 30): Promise<ApiCostSummary> {
  const { data, error } = await supabase.rpc('get_api_cost_summary', {
    p_days: days,
  });

  if (error) {
    throw new APIError(`Failed to fetch API costs: ${error.message}`, 500, error.code);
  }

  // Return default values if no data
  if (!data) {
    return {
      total_cost_usd: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_requests: 0,
      avg_cost_per_request: 0,
      by_model: [],
      by_function: [],
      daily_costs: [],
      budget_usd: 20,
      days,
    };
  }

  return data;
}

// Get all topics (including inactive) for admin
export async function getAllTopics(): Promise<Topic[]> {
  const { data, error } = await supabase.rpc('get_all_topics_admin');

  if (error) {
    // Fallback to direct query
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('topics')
      .select('*')
      .order('sort_order');

    if (fallbackError) {
      throw new APIError(`Failed to fetch topics: ${fallbackError.message}`, 500, fallbackError.code);
    }
    return fallbackData || [];
  }
  return data || [];
}

// Update topic (admin)
export async function updateTopic(topicData: Partial<Topic>): Promise<Topic> {
  if (!topicData.id) {
    throw new APIError('Topic ID is required', 400, 'MISSING_ID');
  }

  const { data, error } = await supabase.rpc('update_topic_admin', {
    p_topic_id: topicData.id,
    p_name_ar: topicData.name_ar,
    p_name_en: topicData.name_en,
    p_slug: topicData.slug,
    p_icon: topicData.icon,
    p_color: topicData.color,
    p_is_active: topicData.is_active,
    p_sort_order: topicData.sort_order,
  });

  if (error) {
    throw new APIError(`Failed to update topic: ${error.message}`, 500, error.code);
  }
  return data;
}

// Get source story counts
export async function getSourceStoryCounts(): Promise<SourceStoryCount[]> {
  const { data, error } = await supabase.rpc('get_source_story_counts');

  if (error) {
    // Return empty if function doesn't exist
    if (error.code === 'PGRST202') {
      return [];
    }
    throw new APIError(`Failed to fetch source story counts: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// ============================================
// PDPL COMPLIANCE API FUNCTIONS
// ============================================

// User data export structure
export interface UserDataExport {
  exportDate: string;
  profile: Profile | null;
  savedStories: SavedStory[];
  notes: Note[];
  readingHistory: { story_id: string; read_at: string }[];
  blockedSources: BlockedSource[];
  preferences: {
    language: string;
    theme: string;
    notificationPreferences: unknown;
  };
}

// Export all user data (PDPL Right to Access & Portability)
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const validUserId = validateInput(UserIdSchema, userId);

  // Fetch all user data in parallel
  const [profile, savedStories, notes, interactions, blockedSources] = await Promise.all([
    getProfile(validUserId),
    getSavedStories(validUserId),
    getNotes(validUserId).catch(() => []), // Notes may not exist for free users
    supabase
      .from('user_story_interactions')
      .select('story_id, created_at')
      .eq('user_id', validUserId)
      .eq('interaction_type', 'view')
      .order('created_at', { ascending: false }),
    getBlockedSources(validUserId),
  ]);

  const readingHistory = (interactions.data || []).map(item => ({
    story_id: item.story_id,
    read_at: item.created_at,
  }));

  return {
    exportDate: new Date().toISOString(),
    profile,
    savedStories,
    notes,
    readingHistory,
    blockedSources,
    preferences: {
      language: profile?.notification_preferences ? 'stored_in_profile' : 'default',
      theme: 'stored_locally',
      notificationPreferences: profile?.notification_preferences || {},
    },
  };
}

// Delete user account and all data (PDPL Right to Deletion)
export async function deleteUserAccount(userId: string): Promise<void> {
  const validUserId = validateInput(UserIdSchema, userId);

  // Delete all user data in order (respecting foreign key constraints)
  // 1. Delete interactions
  await supabase
    .from('user_story_interactions')
    .delete()
    .eq('user_id', validUserId);

  // 2. Delete saved stories
  await supabase
    .from('saved_stories')
    .delete()
    .eq('user_id', validUserId);

  // 3. Delete notes
  await supabase
    .from('notes')
    .delete()
    .eq('user_id', validUserId);

  // 4. Delete blocked sources
  await supabase
    .from('blocked_sources')
    .delete()
    .eq('user_id', validUserId);

  // 5. Cancel any active subscription
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancel_at_period_end: true })
    .eq('user_id', validUserId);

  // 6. Delete profile (this cascades to auth.users via RLS)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', validUserId);

  if (profileError) {
    throw new APIError(`Failed to delete account: ${profileError.message}`, 500, profileError.code);
  }

  // Note: Auth user deletion is handled by Supabase Auth triggers or admin API
  // The client should call signOut() after this
}

// Re-export validation utilities for use elsewhere
export { ValidationError };
