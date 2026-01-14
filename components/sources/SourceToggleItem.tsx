import { View, TouchableOpacity, Text, Image, Switch, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSourceLogo } from '@/lib/image';
import type { Source } from '@/types';

interface SourceToggleItemProps {
  source: Source;
  isSelected: boolean;
  onToggle: () => void;
  isArabic: boolean;
}

export function SourceToggleItem({ source, isSelected, onToggle, isArabic }: SourceToggleItemProps) {
  const { colors } = useTheme();

  // Get logo URL: manual override -> Google Favicons auto-fetch -> null
  const logoUrl = getSourceLogo(source.url, source.logo_url);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={source.name}
    >
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.logo} />
      ) : (
        <View style={[styles.logoPlaceholder, { backgroundColor: colors.surfaceLight }]}>
          <FontAwesome name="newspaper-o" size={18} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {source.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.languageBadge, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.languageText, { color: colors.textMuted }]}>
              {source.language === 'ar' ? 'عربي' : 'EN'}
            </Text>
          </View>
        </View>
      </View>
      <Switch
        value={isSelected}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceLight, true: colors.primary }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  languageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  languageText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
