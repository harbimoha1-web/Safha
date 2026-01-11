import { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import { SourceToggleItem } from './SourceToggleItem';
import { LanguageFilterBar } from './LanguageFilterBar';
import type { Topic, Source, LanguageFilter } from '@/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TopicAccordionProps {
  topic: Topic;
  sources: Source[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  languageFilter: LanguageFilter;
  onLanguageFilterChange: (filter: LanguageFilter) => void;
  deselectedSources: string[];
  onToggleSource: (sourceId: string) => void;
  onSelectAll: (sourceIds: string[]) => void;
  isArabic: boolean;
}

export function TopicAccordion({
  topic,
  sources,
  isExpanded,
  onToggleExpand,
  languageFilter,
  onLanguageFilterChange,
  deselectedSources,
  onToggleSource,
  onSelectAll,
  isArabic,
}: TopicAccordionProps) {
  const { colors } = useTheme();

  // Filter sources by language
  const filteredSources = useMemo(() => {
    if (languageFilter === 'all') return sources;
    return sources.filter((s) => s.language === languageFilter);
  }, [sources, languageFilter]);

  // Count selected sources
  const selectedCount = useMemo(() => {
    return filteredSources.filter((s) => !deselectedSources.includes(s.id)).length;
  }, [filteredSources, deselectedSources]);

  // Check if all sources are selected (for toggle button state)
  const allSelected = useMemo(() => {
    return filteredSources.length > 0 &&
      filteredSources.every((s) => !deselectedSources.includes(s.id));
  }, [filteredSources, deselectedSources]);

  const topicColor = topic.color || getTopicColor(topic.slug);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
  };

  const handleSelectAll = () => {
    const sourceIds = filteredSources.map((s) => s.id);
    onSelectAll(sourceIds);
  };

  // Show topic even if no sources for current language filter
  // (sources will appear when user changes filter)
  if (sources.length === 0) {
    return null; // Only hide if topic has no sources at all
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: colors.surface }]}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={isArabic ? topic.name_ar : topic.name_en}
      >
        <View style={[styles.iconContainer, { backgroundColor: topicColor }]}>
          <FontAwesome name={getTopicIcon(topic.slug)} size={18} color="#fff" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.topicName, { color: colors.textPrimary }]}>
            {isArabic ? topic.name_ar : topic.name_en}
          </Text>
          <Text style={[styles.sourceCount, { color: colors.textMuted }]}>
            {sources.length} {isArabic ? 'مصادر' : 'sources'}
          </Text>
        </View>
        <FontAwesome
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Language Filter */}
          <LanguageFilterBar
            value={languageFilter}
            onChange={onLanguageFilterChange}
            isArabic={isArabic}
          />

          {/* Select/Deselect All Toggle */}
          <TouchableOpacity
            style={[styles.selectAllButton, { borderColor: colors.border }]}
            onPress={handleSelectAll}
            accessibilityRole="button"
            accessibilityLabel={
              allSelected
                ? (isArabic ? 'إلغاء تحديد الكل' : 'Deselect All')
                : (isArabic ? 'تحديد الكل' : 'Select All')
            }
          >
            <FontAwesome
              name={allSelected ? 'square-o' : 'check-square-o'}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.selectAllText, { color: colors.primary }]}>
              {allSelected
                ? (isArabic ? 'إلغاء تحديد الكل' : 'Deselect All')
                : (isArabic ? 'تحديد الكل' : 'Select All')
              }
            </Text>
          </TouchableOpacity>

          {/* Sources List */}
          {filteredSources.map((source) => (
            <SourceToggleItem
              key={source.id}
              source={source}
              isSelected={!deselectedSources.includes(source.id)}
              onToggle={() => onToggleSource(source.id)}
              isArabic={isArabic}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sourceCount: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  content: {
    paddingTop: spacing.md,
    paddingLeft: spacing.lg,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  selectAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
