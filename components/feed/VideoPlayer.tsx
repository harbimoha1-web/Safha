import { useRef, useState, useEffect, useCallback } from 'react';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/app';
import { createLogger } from '@/lib/debug';

const log = createLogger('VideoPlayer');

const { width, height } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  poster?: string;
  isActive: boolean;
}

/**
 * Video player component for feed stories.
 * Auto-plays when active (respecting user settings), loops continuously.
 * Starts muted for autoplay, user can tap to pause/resume.
 */
export function VideoPlayer({ uri, poster, isActive }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const { settings } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle auto-play based on active state and user settings
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive && settings.autoPlayVideos) {
      videoRef.current.playAsync().catch(() => {
        // Silently fail - video might not be ready
      });
    } else {
      videoRef.current.pauseAsync().catch(() => {
        // Silently fail
      });
    }
  }, [isActive, settings.autoPlayVideos]);

  // Handle playback status updates
  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(false);
      setHasError(false);
    } else if ('error' in status) {
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  // Toggle play/pause on tap
  const handleTogglePlayback = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
      }
    } catch (error) {
      log.error('Video playback toggle error:', error);
    }
  }, []);

  // Don't render if there's an error
  if (hasError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        posterSource={poster ? { uri: poster } : undefined}
        usePoster={!!poster}
        posterStyle={styles.poster}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isActive && settings.autoPlayVideos}
        isLooping
        isMuted // Autoplay requires muted for browser policies
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoadStart={() => setIsLoading(true)}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Play/Pause overlay button */}
      <TouchableOpacity
        style={styles.playButtonOverlay}
        onPress={handleTogglePlayback}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
      >
        {!isPlaying && !isLoading && (
          <View style={styles.playButton}>
            <Ionicons name="play" size={48} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {/* Video indicator badge */}
      <View style={styles.videoBadge}>
        <Ionicons name="videocam" size={14} color="white" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  poster: {
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 6, // Visual offset for play icon
  },
  videoBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
