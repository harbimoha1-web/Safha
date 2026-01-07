// FontAwesome icon mapping for topics
// Using FontAwesome icons for consistent cross-platform rendering

export type TopicIconName =
  | 'university'
  | 'line-chart'
  | 'futbol-o'
  | 'laptop'
  | 'film'
  | 'heartbeat'
  | 'flask'
  | 'plane'
  | 'newspaper-o'
  | 'globe'
  | 'graduation-cap'
  | 'briefcase'
  | 'car'
  | 'cutlery'
  | 'home'
  | 'music'
  | 'diamond'
  | 'video-camera'
  | 'smile-o'
  | 'users'
  | 'lightbulb-o'
  | 'star'
  | 'gamepad'
  | 'paw'
  | 'wrench'
  | 'paint-brush'
  | 'book'
  | 'magic'
  | 'tree'
  | 'eye';

// Map topic slugs to FontAwesome icon names
export const TOPIC_ICONS: Record<string, TopicIconName> = {
  // Core topics
  politics: 'university',
  economy: 'line-chart',
  technology: 'laptop',
  // New topics
  'food-drink': 'cutlery',
  'beauty-style': 'diamond',
  music: 'music',
  'fitness-health': 'heartbeat',
  vlogs: 'video-camera',
  comedy: 'smile-o',
  sports: 'futbol-o',
  'entertainment-culture': 'film',
  'science-education': 'graduation-cap',
  family: 'users',
  'motivation-advice': 'lightbulb-o',
  dance: 'star',
  travel: 'plane',
  gaming: 'gamepad',
  pets: 'paw',
  'auto-vehicle': 'car',
  diy: 'wrench',
  art: 'paint-brush',
  'anime-comics': 'book',
  'life-hacks': 'magic',
  outdoors: 'tree',
  'oddly-satisfying': 'eye',
  'home-garden': 'home',
  // Legacy mappings for backwards compatibility
  entertainment: 'film',
  health: 'heartbeat',
  science: 'flask',
  news: 'newspaper-o',
  world: 'globe',
  education: 'graduation-cap',
  business: 'briefcase',
  automotive: 'car',
  food: 'cutlery',
  lifestyle: 'home',
};

// Get icon name for a topic, with fallback
export function getTopicIcon(slug: string): TopicIconName {
  return TOPIC_ICONS[slug.toLowerCase()] || 'newspaper-o';
}

// Topic colors (consistent with database)
export const TOPIC_COLORS: Record<string, string> = {
  // Core topics
  politics: '#DC2626',
  economy: '#16A34A',
  technology: '#7C3AED',
  // New topics
  'food-drink': '#F97316',
  'beauty-style': '#EC4899',
  music: '#8B5CF6',
  'fitness-health': '#10B981',
  vlogs: '#06B6D4',
  comedy: '#FBBF24',
  sports: '#2563EB',
  'entertainment-culture': '#DB2777',
  'science-education': '#0891B2',
  family: '#F472B6',
  'motivation-advice': '#A855F7',
  dance: '#F43F5E',
  travel: '#F59E0B',
  gaming: '#6366F1',
  pets: '#84CC16',
  'auto-vehicle': '#EF4444',
  diy: '#78716C',
  art: '#D946EF',
  'anime-comics': '#FB7185',
  'life-hacks': '#14B8A6',
  outdoors: '#22C55E',
  'oddly-satisfying': '#7C3AED',
  'home-garden': '#059669',
  // Legacy mappings for backwards compatibility
  entertainment: '#FFEAA7',
  health: '#DDA0DD',
  science: '#98D8C8',
  news: '#A8A8A8',
  world: '#5DADE2',
  education: '#AF7AC5',
  business: '#58D68D',
  automotive: '#EB984E',
  food: '#F5B041',
  lifestyle: '#EC7063',
};

// Get color for a topic, with fallback
export function getTopicColor(slug: string): string {
  return TOPIC_COLORS[slug.toLowerCase()] || '#A8A8A8';
}
