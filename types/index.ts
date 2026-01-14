// Safha App Type Definitions

export type UserRole = 'user' | 'admin' | 'moderator';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  language: 'ar' | 'en';
  notification_preferences: NotificationPreferences;
  selected_topics: string[];
  role?: UserRole;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  daily_digest: boolean;
  breaking_news: boolean;
  weekly_summary: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}

export interface Topic {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  logo_url: string | null;
  language: 'ar' | 'en';
  reliability_score: number;
  is_active: boolean;
}

export interface Story {
  id: string;
  source_id: string;
  source?: Source;
  original_url: string;
  original_title: string | null;
  title_ar: string | null;
  title_en: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  // Full article content (scraped from webpage)
  full_content: string | null;
  content_quality: number | null;
  // AI-generated fields
  why_it_matters_ar: string | null;
  why_it_matters_en: string | null;
  ai_quality_score: number | null;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  // Media fields
  image_url: string | null;
  video_url: string | null;
  video_type: 'mp4' | 'youtube' | 'vimeo' | null;
  // Other fields
  topic_ids: string[];
  topics?: Topic[];
  published_at: string | null;
  created_at: string;
  view_count: number;
  save_count: number;
  share_count: number;
}

// AI Types
export interface AISummaryRequest {
  title: string;
  content: string;
  source_language: 'ar' | 'en';
}

export interface AISummaryResponse {
  summary_ar: string;
  summary_en: string;
  why_it_matters_ar: string;
  why_it_matters_en: string;
  quality_score: number;
  topics: string[];
}

export interface UserStoryInteraction {
  id: string;
  user_id: string;
  story_id: string;
  interaction_type: 'view' | 'save' | 'share' | 'skip';
  created_at: string;
}

export interface SavedStory {
  id: string;
  user_id: string;
  story_id: string;
  story?: Story;
  created_at: string;
}

export interface BlockedSource {
  id: string;
  user_id: string;
  source_id: string;
  source?: Source;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  story_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  story?: Story;
}

// RSS Types
export interface RSSSource {
  id: string;
  name: string;
  feed_url: string;
  website_url: string | null;
  language: 'ar' | 'en';
  category: string | null;
  logo_url: string | null;
  is_active: boolean;
  reliability_score: number;
  last_fetched_at: string | null;
  fetch_interval_minutes: number;
  error_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawArticle {
  id: string;
  rss_source_id: string;
  rss_source?: RSSSource;
  guid: string | null;
  original_url: string;
  original_title: string | null;
  original_content: string | null;
  original_description: string | null;
  full_content: string | null;
  content_quality: number | null;
  author: string | null;
  image_url: string | null;
  video_url: string | null;
  video_type: string | null;
  published_at: string | null;
  fetched_at: string;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'duplicate' | 'rejected';
  processed_at: string | null;
  story_id: string | null;
  error_message: string | null;
  retry_count: number;
  content_hash: string | null;
}

// App State Types
export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark' | 'system';
export type NewsFrequency = 'daily' | 'weekly' | 'casual' | null;
export type LanguageFilter = 'all' | 'ar' | 'en';
export type ContentLanguage = 'all' | 'ar' | 'en';

export interface TopicSourceMapping {
  topic_id: string;
  source_ids: string[];
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  textSize: 'small' | 'medium' | 'large';
  autoPlayVideos: boolean;
  newsFrequency: NewsFrequency;
  contentLanguage: ContentLanguage;
}

// Admin Types
export interface AdminAuditLog {
  id: string;
  admin_id: string | null;
  action_type: string;
  target_table: string;
  target_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminDashboardStats {
  pending_stories: number;
  total_stories: number;
  active_sources: number;
  total_sources: number;
  total_users: number;
  premium_users: number;
  stories_today: number;
  users_today: number;
}

export interface AdminStoryFilters {
  status?: 'pending' | 'approved' | 'rejected';
  source_id?: string;
  topic_id?: string;
  language?: 'ar' | 'en';
  date_from?: string;
  date_to?: string;
}

export interface AdminSourceFilters {
  is_active?: boolean;
  language?: 'ar' | 'en';
  category?: string;
  has_errors?: boolean;
}
