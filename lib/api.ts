import { supabase } from './supabase';
import type { Story, Topic, Profile, SavedStory, Note } from '@/types';
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
  topicIds?: string[]
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

  // Escape SQL wildcards to prevent injection
  const escapedQuery = escapeSqlWildcards(validQuery);

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
    .limit(validLimit);

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

// Re-export validation utilities for use elsewhere
export { ValidationError };
