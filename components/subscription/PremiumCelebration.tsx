// PremiumCelebration - Confetti celebration on subscription success
import { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { premiumColors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { HapticFeedback } from '@/lib/haptics';

const { width, height } = Dimensions.get('window');
const CONFETTI_COUNT = 30;

interface PremiumCelebrationProps {
  visible: boolean;
  onClose: () => void;
  isArabic: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
}

export function PremiumCelebration({ visible, onClose, isArabic }: PremiumCelebrationProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);

  // Generate confetti pieces
  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      color: premiumColors.confetti[i % premiumColors.confetti.length],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
  }, []);

  useEffect(() => {
    if (!visible) return;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      reduceMotionRef.current = reduceMotion;

      // Trigger success haptic
      HapticFeedback.upgradeToPremium();

      if (reduceMotion) {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
        return;
      }

      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      iconRotate.setValue(0);
      confettiAnim.setValue(0);

      // Entrance animation sequence
      Animated.sequence([
        // Fade in overlay
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Spring in content
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
          // Icon rotation wiggle
          Animated.sequence([
            Animated.timing(iconRotate, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(iconRotate, {
              toValue: -1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(iconRotate, {
              toValue: 0.5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(iconRotate, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();

      // Confetti animation
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }).start();
    });
  }, [visible]);

  const handleClose = () => {
    HapticFeedback.buttonPress();

    if (reduceMotionRef.current) {
      onClose();
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const iconRotateInterpolate = iconRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Confetti */}
        {!reduceMotionRef.current &&
          confettiPieces.map((piece) => {
            const translateY = confettiAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, height + 100],
            });
            const rotate = confettiAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${360 * (piece.id % 2 === 0 ? 2 : -2)}deg`],
            });
            const opacity = confettiAnim.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0, 1, 1, 0],
            });

            return (
              <Animated.View
                key={piece.id}
                style={[
                  styles.confetti,
                  {
                    left: piece.x,
                    width: piece.size,
                    height: piece.size,
                    backgroundColor: piece.color,
                    borderRadius: piece.id % 3 === 0 ? piece.size / 2 : 0,
                    opacity,
                    transform: [{ translateY }, { rotate }],
                  },
                ]}
              />
            );
          })}

        {/* Content Card */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { shadowColor: colors.primary },
              { transform: [{ rotate: iconRotateInterpolate }] },
            ]}
          >
            <FontAwesome name="diamond" size={50} color={colors.primary} />
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
            {isArabic ? 'مرحباً بك في Premium!' : 'Welcome to Premium!'}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
            {isArabic
              ? 'أنت الآن تستمتع بكل المميزات الحصرية'
              : "You now have access to all exclusive features"}
          </Text>

          {/* Features unlocked */}
          <View style={styles.features}>
            <FeatureItem
              text={isArabic ? 'ملخص AI يومي' : 'Daily AI Summary'}
              isArabic={isArabic}
              colors={colors}
            />
            <FeatureItem
              text={isArabic ? 'بدون إعلانات' : 'Ad-Free Experience'}
              isArabic={isArabic}
              colors={colors}
            />
            <FeatureItem
              text={isArabic ? 'ملخص واتساب أسبوعي' : 'Weekly WhatsApp Digest'}
              isArabic={isArabic}
              colors={colors}
            />
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'ابدأ الآن' : 'Get Started'}
          >
            <Text style={styles.buttonText}>
              {isArabic ? 'ابدأ الآن' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function FeatureItem({ text, isArabic, colors }: { text: string; isArabic: boolean; colors: any }) {
  return (
    <View style={[styles.featureItem, isArabic && styles.featureItemRtl]}>
      <FontAwesome name="check-circle" size={18} color={colors.success} />
      <Text style={[styles.featureText, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
        {text}
      </Text>
    </View>
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
    top: 0,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    maxWidth: 340,
    width: '90%',
    borderWidth: 1,
    borderColor: premiumColors.goldGlow,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  features: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureItemRtl: {
    flexDirection: 'row-reverse',
  },
  featureText: {
    fontSize: fontSize.md,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  arabicText: {
    textAlign: 'right',
  },
});
