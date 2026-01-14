import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface TopicFallbackProps {
  topicSlug?: string;
  sourceName?: string;
}

/**
 * Fallback component shown when a story has no image.
 * Displays the source name prominently on a dark background.
 * Mohammad's choice: Source name card instead of topic gradient.
 */
export function TopicFallback({ topicSlug, sourceName }: TopicFallbackProps) {
  const displayName = sourceName || 'News';

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Centered content */}
      <View style={styles.contentContainer}>
        {/* News icon */}
        <View style={styles.iconCircle}>
          <FontAwesome name="newspaper-o" size={32} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Source name - Large and prominent */}
        <Text style={styles.sourceName} numberOfLines={2}>
          {displayName}
        </Text>

        {/* Small label */}
        <Text style={styles.newsLabel}>
          {topicSlug ? topicSlug.charAt(0).toUpperCase() + topicSlug.slice(1) : 'News'}
        </Text>
      </View>

      {/* Subtle pattern lines */}
      <View style={styles.patternContainer}>
        {[...Array(5)].map((_, i) => (
          <View key={i} style={[styles.patternLine, { top: 100 + i * 150 }]} />
        ))}
      </View>
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
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sourceName: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  newsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});
