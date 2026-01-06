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
  | 'music';

// Map topic slugs to FontAwesome icon names
export const TOPIC_ICONS: Record<string, TopicIconName> = {
  // Core topics
  politics: 'university',
  economy: 'line-chart',
  sports: 'futbol-o',
  technology: 'laptop',
  entertainment: 'film',
  health: 'heartbeat',
  science: 'flask',
  travel: 'plane',
  // Additional topics
  news: 'newspaper-o',
  world: 'globe',
  education: 'graduation-cap',
  business: 'briefcase',
  automotive: 'car',
  food: 'cutlery',
  lifestyle: 'home',
  music: 'music',
};

// Get icon name for a topic, with fallback
export function getTopicIcon(slug: string): TopicIconName {
  return TOPIC_ICONS[slug.toLowerCase()] || 'newspaper-o';
}

// Topic colors (consistent with database)
export const TOPIC_COLORS: Record<string, string> = {
  politics: '#FF6B6B',
  economy: '#4ECDC4',
  sports: '#45B7D1',
  technology: '#96CEB4',
  entertainment: '#FFEAA7',
  health: '#DDA0DD',
  science: '#98D8C8',
  travel: '#F7DC6F',
  news: '#A8A8A8',
  world: '#5DADE2',
  education: '#AF7AC5',
  business: '#58D68D',
  automotive: '#EB984E',
  food: '#F5B041',
  lifestyle: '#EC7063',
  music: '#BB8FCE',
};

// Get color for a topic, with fallback
export function getTopicColor(slug: string): string {
  return TOPIC_COLORS[slug.toLowerCase()] || '#A8A8A8';
}
