import { supabase } from './supabase';
import type { Story, Topic, Profile, SavedStory } from '@/types';

// Stories API
export async function getStories(limit = 20, offset = 0): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      source:sources(*)
    `)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getStoryById(id: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      source:sources(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getStoriesByTopic(topicId: string, limit = 20): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      source:sources(*)
    `)
    .contains('topic_ids', [topicId])
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Topics API
export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

// Profile API
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Saved Stories API
export async function getSavedStories(userId: string): Promise<SavedStory[]> {
  const { data, error } = await supabase
    .from('saved_stories')
    .select(`
      *,
      story:stories(
        *,
        source:sources(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveStory(userId: string, storyId: string): Promise<SavedStory> {
  const { data, error } = await supabase
    .from('saved_stories')
    .insert({ user_id: userId, story_id: storyId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unsaveStory(userId: string, storyId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_stories')
    .delete()
    .eq('user_id', userId)
    .eq('story_id', storyId);

  if (error) throw error;
}

// Interactions API
export async function recordInteraction(
  userId: string,
  storyId: string,
  type: 'view' | 'save' | 'share' | 'skip'
): Promise<void> {
  const { error } = await supabase
    .from('user_story_interactions')
    .upsert({
      user_id: userId,
      story_id: storyId,
      interaction_type: type,
    });

  if (error) throw error;
}

// Search API
export async function searchStories(query: string, limit = 20): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      source:sources(*)
    `)
    .or(`title_ar.ilike.%${query}%,title_en.ilike.%${query}%,summary_ar.ilike.%${query}%,summary_en.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
