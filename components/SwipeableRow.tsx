import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
// RTL support: reverse swipe direction for Arabic users
const IS_RTL = I18nManager.isRTL;
const SWIPE_THRESHOLD = IS_RTL ? 80 : -80;
const DELETE_THRESHOLD = IS_RTL ? 120 : -120;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteText?: string;
}

export function SwipeableRow({ children, onDelete, deleteText = IS_RTL ? 'حذف' : 'Delete' }: SwipeableRowProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const hasTriggeredHaptic = useRef(false);

  // Store onDelete in a ref to avoid stale closure in PanResponder
  // PanResponder is created once at mount, so we need a stable reference
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete; // Update on every render

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // RTL: respond to right swipe, LTR: respond to left swipe
        const isSwipeInCorrectDirection = IS_RTL
          ? gestureState.dx > 10
          : gestureState.dx < -10;
        return isSwipeInCorrectDirection && Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        // RTL: only allow right swipe (positive), LTR: only allow left swipe (negative)
        const isValidSwipe = IS_RTL ? gestureState.dx > 0 : gestureState.dx < 0;
        if (isValidSwipe) {
          translateX.setValue(gestureState.dx);

          // Haptic feedback when crossing delete threshold
          const crossedThreshold = IS_RTL
            ? gestureState.dx > DELETE_THRESHOLD
            : gestureState.dx < DELETE_THRESHOLD;
          const belowThreshold = IS_RTL
            ? gestureState.dx < DELETE_THRESHOLD
            : gestureState.dx > DELETE_THRESHOLD;

          if (crossedThreshold && !hasTriggeredHaptic.current) {
            hasTriggeredHaptic.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else if (belowThreshold) {
            hasTriggeredHaptic.current = false;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        hasTriggeredHaptic.current = false;

        const crossedDeleteThreshold = IS_RTL
          ? gestureState.dx > DELETE_THRESHOLD
          : gestureState.dx < DELETE_THRESHOLD;
        const crossedSwipeThreshold = IS_RTL
          ? gestureState.dx > SWIPE_THRESHOLD
          : gestureState.dx < SWIPE_THRESHOLD;

        if (crossedDeleteThreshold) {
          // Swipe far enough - trigger delete
          Animated.timing(translateX, {
            toValue: IS_RTL ? SCREEN_WIDTH : -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDeleteRef.current(); // Use ref to get latest callback
          });
        } else if (crossedSwipeThreshold) {
          // Show delete button
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            friction: 8,
          }).start();
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        hasTriggeredHaptic.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const handleDeletePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(translateX, {
      toValue: IS_RTL ? SCREEN_WIDTH : -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDelete();
    });
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Delete button background - positioned based on RTL */}
      <View style={[
        styles.deleteContainer,
        IS_RTL ? styles.deleteContainerRTL : styles.deleteContainerLTR
      ]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePress}
          activeOpacity={0.8}
          accessibilityLabel={IS_RTL ? 'حذف العنصر' : 'Delete item'}
          accessibilityRole="button"
        >
          <FontAwesome name="trash-o" size={20} color="#fff" />
          <Text style={styles.deleteText}>{deleteText}</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable content */}
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: colors.surface },
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={1} onPress={resetPosition}>
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 12,
  },
  content: {
    borderRadius: 12,
  },
  deleteContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  deleteContainerLTR: {
    right: 0,
  },
  deleteContainerRTL: {
    left: 0,
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
