import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { ContentLanguage } from '@/types';

interface ContentLanguageSelectorProps {
  isArabic: boolean;
}

// Animated pill button component
function LanguagePill({
  isActive,
  onPress,
  icon,
  label,
  colors,
}: {
  isActive: boolean;
  onPress: () => void;
  icon: string;
  label: string;
  colors: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={[styles.pillWrapper, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: isActive ? colors.primary : colors.surface },
          isActive && {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          },
          !isActive && { borderWidth: 1, borderColor: colors.border },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ selected: isActive }}
      >
        <FontAwesome
          name={icon as any}
          size={16}
          color={isActive ? '#fff' : colors.textMuted}
        />
        <Text
          style={[
            styles.pillText,
            { color: isActive ? '#fff' : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ContentLanguageSelector({ isArabic }: ContentLanguageSelectorProps) {
  const { colors } = useTheme();
  const { settings, setContentLanguage } = useAppStore();

  const options: { key: ContentLanguage; icon: string; labelEn: string; labelAr: string }[] = [
    { key: 'all', icon: 'globe', labelEn: 'All', labelAr: 'الكل' },
    { key: 'ar', icon: 'font', labelEn: 'عربي', labelAr: 'عربي' },
    { key: 'en', icon: 'language', labelEn: 'EN', labelAr: 'EN' },
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <View style={[styles.header, isArabic && styles.headerRtl]}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          <FontAwesome name="globe" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }, isArabic && styles.textRtl]}>
            {isArabic ? 'لغة المحتوى' : 'Content Language'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }, isArabic && styles.textRtl]}>
            {isArabic ? 'اختر لغة الأخبار' : 'Choose news language'}
          </Text>
        </View>
      </View>

      <View style={[styles.pillsContainer, isArabic && styles.pillsContainerRtl]}>
        {options.map((option) => (
          <LanguagePill
            key={option.key}
            isActive={settings.contentLanguage === option.key}
            onPress={() => setContentLanguage(option.key)}
            icon={option.icon}
            label={isArabic ? option.labelAr : option.labelEn}
            colors={colors}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRtl: {
    flexDirection: 'row-reverse',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  textRtl: {
    textAlign: 'right',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillsContainerRtl: {
    flexDirection: 'row-reverse',
  },
  pillWrapper: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
