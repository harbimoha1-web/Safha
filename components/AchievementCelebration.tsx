// Achievement Celebration Modal
// Full-screen celebration when user unlocks an achievement (majnon's psychology fix)

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores';

const { width, height } = Dimensions.get('window');

interface Achievement {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  category: string;
  points: number;
}

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
}

export function AchievementCelebration({
  achievement,
  visible,
  onClose,
}: AchievementCelebrationProps) {
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiAnim.setValue(0);

      // Start celebration animation sequence
      Animated.sequence([
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Pop in with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotate trophy
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();

      // Confetti animation
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  const name = isArabic ? achievement.name_ar : achievement.name_en;
  const description = isArabic
    ? achievement.description_ar
    : achievement.description_en;

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const getIconName = (category: string): string => {
    switch (category) {
      case 'streak':
        return 'fire';
      case 'reading':
        return 'book';
      case 'engagement':
        return 'star';
      case 'premium':
        return 'diamond';
      default:
        return 'trophy';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'streak':
        return '#FF6B35';
      case 'reading':
        return '#4ECDC4';
      case 'engagement':
        return '#FFE66D';
      case 'premium':
        return '#A855F7';
      default:
        return '#FFD700';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Confetti particles */}
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.confetti,
              {
                left: Math.random() * width,
                backgroundColor: ['#FFD700', '#FF6B35', '#4ECDC4', '#A855F7', '#FF1493'][
                  i % 5
                ],
                transform: [
                  {
                    translateY: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, height + 50],
                    }),
                  },
                  {
                    rotate: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${360 * (i % 2 === 0 ? 1 : -1)}deg`],
                    }),
                  },
                ],
                opacity: confettiAnim.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
              },
            ]}
          />
        ))}

        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Trophy icon with rotation */}
          <Animated.View
            style={[
              styles.trophyContainer,
              { backgroundColor: getCategoryColor(achievement.category) + '20' },
              { transform: [{ rotate: spin }] },
            ]}
          >
            <FontAwesome
              name={getIconName(achievement.category) as any}
              size={64}
              color={getCategoryColor(achievement.category)}
            />
          </Animated.View>

          {/* Title */}
          <Text style={styles.celebrationTitle}>
            {isArabic ? 'إنجاز جديد!' : 'ACHIEVEMENT UNLOCKED!'}
          </Text>

          {/* Achievement name */}
          <Text style={[styles.achievementName, isArabic && styles.arabicText]}>
            {name}
          </Text>

          {/* Description */}
          {description && (
            <Text
              style={[styles.achievementDescription, isArabic && styles.arabicText]}
            >
              {description}
            </Text>
          )}

          {/* Points earned */}
          <View style={styles.pointsContainer}>
            <FontAwesome name="star" size={20} color="#FFD700" />
            <Text style={styles.pointsText}>
              +{achievement.points} {isArabic ? 'نقطة' : 'points'}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>
              {isArabic ? 'رائع!' : 'Awesome!'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: width - 48,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  trophyContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  achievementName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  achievementDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  arabicText: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
  },
  closeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
