// Toast Notifications Component
// Provides visual feedback for user actions with queue support

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticFeedback } from '@/lib/haptics';
import { useAppStore } from '@/stores';

const { width } = Dimensions.get('window');
const MAX_VISIBLE_TOASTS = 3;

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  icon?: string;
}

interface ToastItem extends ToastConfig {
  id: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
  translateX: Animated.Value;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

// Individual Toast Component with swipe-to-dismiss
function ToastView({
  toast,
  index,
  onDismiss,
  insetTop,
}: {
  toast: ToastItem;
  index: number;
  onDismiss: (id: number) => void;
  insetTop: number;
}) {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        toast.translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 100) {
          // Swipe threshold reached - dismiss
          Animated.timing(toast.translateX, {
            toValue: gestureState.dx > 0 ? width : -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDismiss(toast.id));
        } else {
          // Snap back
          Animated.spring(toast.translateX, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const getTypeStyles = (type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.95)',
          icon: 'check-circle' as const,
          iconColor: '#fff',
        };
      case 'error':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          icon: 'times-circle' as const,
          iconColor: '#fff',
        };
      case 'warning':
        return {
          // Improved contrast - darker background for better text visibility
          backgroundColor: 'rgba(180, 120, 10, 0.98)',
          icon: 'exclamation-triangle' as const,
          iconColor: '#fff',
        };
      default:
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          icon: 'info-circle' as const,
          iconColor: '#fff',
        };
    }
  };

  const typeStyles = getTypeStyles(toast.type);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toastContainer,
        {
          top: insetTop + 10 + (index * 60),
          backgroundColor: typeStyles.backgroundColor,
          transform: [
            { translateY: toast.translateY },
            { translateX: toast.translateX },
          ],
          opacity: toast.opacity,
          zIndex: 9999 - index,
        },
      ]}
    >
      <FontAwesome
        name={(toast.icon as any) || typeStyles.icon}
        size={20}
        color={typeStyles.iconColor}
      />
      <Text style={styles.toastMessage}>{toast.message}</Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <FontAwesome name="times" size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: ToastProviderProps) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast) {
        Animated.parallel([
          Animated.timing(toast.translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(toast.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const showToast = useCallback((config: ToastConfig) => {
    const id = ++toastIdRef.current;
    const duration = config.duration || 3000;
    const translateY = new Animated.Value(-100);
    const opacity = new Animated.Value(0);
    const translateX = new Animated.Value(0);

    // Add haptic feedback based on type
    switch (config.type) {
      case 'success':
        HapticFeedback.saveStory();
        break;
      case 'error':
        HapticFeedback.error();
        break;
      case 'warning':
        HapticFeedback.warning();
        break;
      default:
        HapticFeedback.buttonPress();
    }

    const newToast: ToastItem = {
      ...config,
      id,
      translateY,
      opacity,
      translateX,
    };

    setToasts((prev) => {
      // Keep only the most recent toasts
      const updated = [...prev, newToast];
      if (updated.length > MAX_VISIBLE_TOASTS) {
        // Dismiss oldest toast
        const oldest = updated[0];
        Animated.timing(oldest.opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
        return updated.slice(1);
      }
      return updated;
    });

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast, index) => (
        <ToastView
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={dismissToast}
          insetTop={insets.top}
        />
      ))}
    </ToastContext.Provider>
  );
}

// Pre-built toast helpers
export function useToastHelpers() {
  const { showToast } = useToast();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  return {
    showSaveSuccess: () =>
      showToast({
        message: isArabic ? 'تم حفظ الخبر' : 'Story saved',
        type: 'success',
        icon: 'bookmark',
      }),
    showUnsaveSuccess: () =>
      showToast({
        message: isArabic ? 'تمت إزالة الخبر من المحفوظات' : 'Removed from saved',
        type: 'info',
        icon: 'bookmark-o',
      }),
    showShareSuccess: () =>
      showToast({
        message: isArabic ? 'تمت المشاركة بنجاح' : 'Shared successfully',
        type: 'success',
        icon: 'share',
      }),
    showError: (message?: string) =>
      showToast({
        message: message || (isArabic ? 'حدث خطأ' : 'Something went wrong'),
        type: 'error',
      }),
    showStreakUpdate: (days: number) =>
      showToast({
        message: isArabic
          ? `سلسلة ${days} أيام!`
          : `${days} day streak!`,
        type: 'success',
        icon: 'fire',
      }),
    showAchievementHint: () =>
      showToast({
        message: isArabic
          ? 'اقتربت من إنجاز جديد!'
          : "You're close to a new achievement!",
        type: 'info',
        icon: 'trophy',
      }),
    showCopied: () =>
      showToast({
        message: isArabic ? 'تم النسخ' : 'Copied to clipboard',
        type: 'success',
        icon: 'copy',
        duration: 2000,
      }),
    showStreakWarning: () =>
      showToast({
        message: isArabic
          ? 'سلسلتك في خطر! اقرأ خبراً للحفاظ عليها'
          : 'Your streak is at risk! Read a story to keep it',
        type: 'warning',
        icon: 'fire',
        duration: 5000,
      }),
  };
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: width - 32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});
