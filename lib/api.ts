import { supabase } from './supabase';
import type { Story, Topic, Source, Profile, SavedStory, Note, BlockedSource, TopicSourceMapping } from '@/types';
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
  blockedSourceIds?: string[]
): Promise<Story[]> {
  // Validate inputs
  const validated = validateInput(StoryQuerySchema, { limit, offset, topicIds });

  let query = supabase
    .from('stories')
    .select(STORY_SELECT)
    .order('published_at', { ascending: false });

  // Filter by topics if provided
  if (validated.topicIds && validated.topicIds.length > 0) {
    query = query.overlaps('topic_ids', validated.topicIds);
  }

  // Filter out blocked sources
  if (blockedSourceIds && blockedSourceIds.length > 0) {
    query = query.not('source_id', 'in', `(${blockedSourceIds.join(',')})`);
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
    console.error('Supabase config missing');
    return { content: null, quality: 0 };
  }

  const maxRetries = 3;
  let lastError: any;

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
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ story_id: storyId, url: originalUrl }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Retry on 502/503/504 errors (cold start / transient)
      if (response.status >= 502 && response.status <= 504) {
        console.log(`Fetch attempt ${attempt} failed with ${response.status}, retrying...`);
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 1000));
          continue;
        }
        return { content: null, quality: 0 };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch content error:', response.status, errorText);
        return { content: null, quality: 0 };
      }

      const data = await response.json();

      if (data?.success && data.content) {
        if (attempt > 1) {
          console.log(`Fetch succeeded on attempt ${attempt}`);
        }
        return { content: data.content, quality: data.quality || 0 };
      }

      if (data && !data.success) {
        console.log('Content extraction failed:', data?.method, data?.error);
      }

      return { content: null, quality: 0 };
    } catch (err: any) {
      lastError = err;
      if (err.name === 'AbortError') {
        console.log(`Fetch attempt ${attempt} timed out`);
      } else {
        console.log(`Fetch attempt ${attempt} error:`, err.message);
      }

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        continue;
      }
    }
  }

  console.error('All fetch attempts failed:', lastError);
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
    .upsert({
      user_id: validUserId,
      story_id: validStoryId,
      interaction_type: validType,
    });

  if (error) {
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
      console.warn('Fuzzy search failed, falling back to exact match:', error.message);
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
    console.warn('Search error, falling back to exact match:', err);
    return searchStoriesExact(validQuery, validLimit);
  }
}

// Fallback exact match search (used if fuzzy search RPC is unavailable)
async function searchStoriesExact(query: string, limit: number): Promise<Story[]> {
  const escapedQuery = escapeSqlWildcards(query);

  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .or(
      `title_ar.ilike.%${escapedQuery}%,` +
        `title_en.ilike.%${escapedQuery}%,` +
        `summary_ar.ilike.%${escapedQuery}%,` +
        `summary_en.ilike.%${escapedQuery}%`
    )
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
    .order('published_at', { ascending: false });

  // Filter by topics if provided
  if (topicIds && topicIds.length > 0) {
    query = query.overlaps('topic_ids', topicIds);
  }

  const { data, error } = await query.limit(validLimit);

  if (error) {
    // Handle missing table gracefully for demo mode
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      console.log('Demo mode: Using sample stories for summary');
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
      console.log('Topic-source mapping function not available, returning empty');
      return [];
    }
    throw new APIError(`Failed to fetch topic-source mapping: ${error.message}`, 500, error.code);
  }
  return data || [];
}

// Re-export validation utilities for use elsewhere
export { ValidationError };
