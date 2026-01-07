import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { LanguageFilter } from '@/types';

interface LanguageFilterBarProps {
  value: LanguageFilter;
  onChange: (filter: LanguageFilter) => void;
  isArabic: boolean;
}

export function LanguageFilterBar({ value, onChange, isArabic }: LanguageFilterBarProps) {
  const { colors } = useTheme();

  const filters: { key: LanguageFilter; labelEn: string; labelAr: string }[] = [
    { key: 'all', labelEn: 'All', labelAr: 'الكل' },
    { key: 'ar', labelEn: 'Arabic', labelAr: 'عربي' },
    { key: 'en', labelEn: 'English', labelAr: 'إنجليزي' },
  ];

  return (
    <View style={styles.container}>
      {filters.map((filter) => {
        const isActive = value === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface },
              isActive && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChange(filter.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={isArabic ? filter.labelAr : filter.labelEn}
          >
            <Text
              style={[
                styles.filterText,
                { color: isActive ? '#fff' : colors.textMuted },
              ]}
            >
              {isArabic ? filter.labelAr : filter.labelEn}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
