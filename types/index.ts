// Teller App Type Definitions

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  language: 'ar' | 'en';
  notification_preferences: NotificationPreferences;
  selected_topics: string[];
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
  image_url: string | null;
  topic_ids: string[];
  topics?: Topic[];
  published_at: string | null;
  created_at: string;
  view_count: number;
  save_count: number;
  share_count: number;
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

// App State Types
export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: Language;
  theme: Theme;
  textSize: 'small' | 'medium' | 'large';
  autoPlayVideos: boolean;
}
