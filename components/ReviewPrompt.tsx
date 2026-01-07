// Review Prompt Modal
// Premium-style review request with beautiful animations and respectful UX
// Users can easily skip or permanently dismiss

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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme';
import {
  REVIEW_MESSAGES,
  handleReviewAccepted,
  handleReviewSkipped,
  handleReviewNeverAsk,
  requestStoreReview,
} from '@/lib/review';

const { width, height } = Dimensions.get('window');

interface ReviewPromptProps {
  visible: boolean;
  onClose: () => void;
  triggerReason?: 'stories' | 'streak' | 'achievements' | null;
}

export function ReviewPrompt({
  visible,
  onClose,
  triggerReason,
}: ReviewPromptProps) {
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';
  const messages = isArabic ? REVIEW_MESSAGES.ar : REVIEW_MESSAGES.en;

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starScaleAnim = useRef(new Animated.Value(0)).current;
  const heartBeatAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      starScaleAnim.setValue(0);

      // Start animation sequence
      Animated.sequence([
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        // Pop in modal with spring
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Stars animation with delay
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(starScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Heart beat animation for the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartBeatAnim, {
            toValue: 1.15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(heartBeatAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
        ])
      ).start();

      // Shimmer animation for the button
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  const handleRate = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await handleReviewAccepted();

    // Request the native store review
    const success = await requestStoreReview();

    // Close the modal
    onClose();
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await handleReviewSkipped();
    onClose();
  };

  const handleNeverAsk = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await handleReviewNeverAsk();
    onClose();
  };

  // Get contextual message based on trigger reason
  const getContextMessage = () => {
    switch (triggerReason) {
      case 'stories':
        return isArabic
          ? 'لقد قرأت 50 خبراً! أنت قارئ متميز.'
          : "You've read 50 stories! You're a dedicated reader.";
      case 'streak':
        return isArabic
          ? 'سلسلة 14 يوماً متتالياً! إنجاز رائع.'
          : '14-day streak! What an achievement.';
      case 'achievements':
        return isArabic
          ? 'حصلت على 5 إنجازات! أنت نجم.'
          : "You've unlocked 5 achievements! You're a star.";
      default:
        return null;
    }
  };

  const contextMessage = getContextMessage();

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Floating stars background */}
        {[...Array(12)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.floatingStar,
              {
                left: `${10 + (i % 4) * 25}%`,
                top: `${15 + Math.floor(i / 4) * 30}%`,
                transform: [
                  { scale: starScaleAnim },
                  {
                    rotate: starScaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${i * 30}deg`],
                    }),
                  },
                ],
                opacity: starScaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3 + (i % 3) * 0.2],
                }),
              },
            ]}
          >
            <FontAwesome
              name="star"
              size={12 + (i % 3) * 8}
              color="#FFD700"
            />
          </Animated.View>
        ))}

        {/* Main content card */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Heart icon with animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: heartBeatAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <FontAwesome name="heart" size={40} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* Context message (if applicable) */}
          {contextMessage && (
            <View style={styles.contextBadge}>
              <FontAwesome name="trophy" size={14} color="#FFD700" />
              <Text style={[styles.contextText, isArabic && styles.arabicText]}>
                {contextMessage}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, isArabic && styles.arabicText]}>
            {messages.title}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, isArabic && styles.arabicText]}>
            {messages.subtitle}
          </Text>

          {/* Message */}
          <Text style={[styles.message, isArabic && styles.arabicText]}>
            {messages.message}
          </Text>

          {/* 5 Stars display */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Animated.View
                key={star}
                style={{
                  transform: [
                    {
                      scale: starScaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                }}
              >
                <FontAwesome name="star" size={32} color="#FFD700" />
              </Animated.View>
            ))}
          </View>

          {/* Rate button with shimmer */}
          <TouchableOpacity
            style={styles.rateButton}
            onPress={handleRate}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#007AFF', '#0056B3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rateButtonGradient}
            >
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />
              <FontAwesome name="star" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.rateButtonText}>{messages.primaryButton}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Skip button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, isArabic && styles.arabicText]}>
              {messages.skipButton}
            </Text>
          </TouchableOpacity>

          {/* Never ask button */}
          <TouchableOpacity
            style={styles.neverButton}
            onPress={handleNeverAsk}
            activeOpacity={0.7}
          >
            <Text style={[styles.neverButtonText, isArabic && styles.arabicText]}>
              {messages.neverButton}
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingStar: {
    position: 'absolute',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    maxWidth: width - 40,
    width: width - 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  contextText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  arabicText: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  rateButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  rateButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  buttonIcon: {
    marginRight: 10,
  },
  rateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  neverButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  neverButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '400',
  },
});
