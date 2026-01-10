import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getTopicGradient, getTopicIcon } from '@/lib/image';

const { width, height } = Dimensions.get('window');

interface TopicFallbackProps {
  topicSlug?: string;
  sourceName?: string;
}

/**
 * Fallback component shown when a story has no image.
 * Displays a topic-themed gradient with icon and source name.
 */
export function TopicFallback({ topicSlug, sourceName }: TopicFallbackProps) {
  const gradient = getTopicGradient(topicSlug);
  const iconName = getTopicIcon(topicSlug);

  return (
    <LinearGradient
      colors={gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Large background icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name={iconName as any}
          size={180}
          color="rgba(255,255,255,0.08)"
        />
      </View>

      {/* Subtle pattern overlay */}
      <View style={styles.patternOverlay} />

      {/* Source name badge if available */}
      {sourceName && (
        <View style={styles.sourceContainer}>
          <View style={styles.sourceBadge}>
            <Ionicons name="newspaper-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sourceText}>{sourceName}</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    top: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
  },
  sourceContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sourceText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
});
