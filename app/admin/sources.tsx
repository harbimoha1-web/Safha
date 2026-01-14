import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSourceLogo } from '@/lib/image';
import { useAllSources, useUpdateSource } from '@/hooks';
import { useSourceStoryCounts } from '@/hooks/useAdminAnalytics';
import type { Source } from '@/types';

type LanguageFilter = 'all' | 'ar' | 'en';
type SortBy = 'name' | 'stories' | 'status';

interface EditModalProps {
  source: Source | null;
  visible: boolean;
  onClose: () => void;
  onSave: (source: Partial<Source>) => void;
  isLoading: boolean;
}

function EditSourceModal({ source, visible, onClose, onSave, isLoading }: EditModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(source?.name || '');
  const [url, setUrl] = useState(source?.url || '');
  const [logoUrl, setLogoUrl] = useState(source?.logo_url || '');
  const [isActive, setIsActive] = useState(source?.is_active ?? true);

  // Update local state when source changes
  useState(() => {
    if (source) {
      setName(source.name);
      setUrl(source.url);
      setLogoUrl(source.logo_url || '');
      setIsActive(source.is_active);
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Source name is required');
      return;
    }
    if (!url.trim()) {
      Alert.alert('Error', 'Website URL is required');
      return;
    }

    onSave({
      id: source?.id,
      name: name.trim(),
      url: url.trim(),
      logo_url: logoUrl.trim() || null,
      is_active: isActive,
    });
  };

  const logoPreview = getSourceLogo(url, logoUrl || null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {source ? 'Edit Source' : 'Add Source'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Logo Preview */}
          <View style={styles.logoPreviewContainer}>
            {logoPreview ? (
              <Image source={{ uri: logoPreview }} style={styles.logoPreview} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                <FontAwesome name="newspaper-o" size={32} color={colors.textMuted} />
              </View>
            )}
            <Text style={[styles.logoHint, { color: colors.textMuted }]}>
              Logo auto-fetched from website, or add custom URL below
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Al Jazeera"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Website URL *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Custom Logo URL (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={logoUrl}
              onChangeText={setLogoUrl}
              placeholder="Leave empty to auto-fetch"
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SourcesManagement() {
  const { colors } = useTheme();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  const { data: sources = [], isLoading, refetch } = useAllSources();
  const { data: storyCounts = [] } = useSourceStoryCounts();
  const updateSourceMutation = useUpdateSource();

  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Create story count map
  const storyCountMap = useMemo(() => {
    const map: Record<string, { total: number; week: number }> = {};
    storyCounts.forEach((sc) => {
      map[sc.source_id] = { total: sc.story_count, week: sc.stories_this_week };
    });
    return map;
  }, [storyCounts]);

  // Filter and sort sources
  const filteredSources = useMemo(() => {
    let result = sources;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (source) =>
          source.name.toLowerCase().includes(query) ||
          source.url.toLowerCase().includes(query)
      );
    }

    // Language filter
    if (languageFilter !== 'all') {
      result = result.filter((source) => source.language === languageFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'stories') {
        const countA = storyCountMap[a.id]?.total || 0;
        const countB = storyCountMap[b.id]?.total || 0;
        return countB - countA;
      }
      if (sortBy === 'status') {
        if (a.is_active === b.is_active) return a.name.localeCompare(b.name);
        return a.is_active ? -1 : 1;
      }
      return 0;
    });

    return result;
  }, [sources, searchQuery, languageFilter, sortBy, storyCountMap]);

  const activeCount = sources.filter((s) => s.is_active).length;

  const handleEditSource = (source: Source) => {
    setEditingSource(source);
    setModalVisible(true);
  };

  const handleSaveSource = async (sourceData: Partial<Source>) => {
    try {
      await updateSourceMutation.mutateAsync(sourceData);
      setModalVisible(false);
      setEditingSource(null);
      Alert.alert(isArabic ? 'تم الحفظ' : 'Success', isArabic ? 'تم تحديث المصدر بنجاح' : 'Source updated successfully');
    } catch (error) {
      Alert.alert(isArabic ? 'خطأ' : 'Error', isArabic ? 'فشل في تحديث المصدر' : 'Failed to update source');
    }
  };

  const handleToggleActive = async (source: Source) => {
    try {
      await updateSourceMutation.mutateAsync({
        id: source.id,
        is_active: !source.is_active,
      });
    } catch (error) {
      Alert.alert(isArabic ? 'خطأ' : 'Error', isArabic ? 'فشل في تغيير الحالة' : 'Failed to toggle status');
    }
  };

  const renderSourceItem = useCallback(({ item }: { item: Source }) => {
    const logoUrl = getSourceLogo(item.url, item.logo_url);
    const counts = storyCountMap[item.id] || { total: 0, week: 0 };

    return (
      <TouchableOpacity
        style={[styles.sourceCard, { backgroundColor: colors.surface }]}
        onPress={() => handleEditSource(item)}
        activeOpacity={0.8}
      >
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.sourceLogo} />
        ) : (
          <View style={[styles.sourceLogoPlaceholder, { backgroundColor: colors.surfaceLight }]}>
            <FontAwesome name="newspaper-o" size={18} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.sourceInfo}>
          <View style={styles.sourceNameRow}>
            <Text style={[styles.sourceName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.languageBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.languageText, { color: colors.primary }]}>
                {item.language?.toUpperCase() || '?'}
              </Text>
            </View>
          </View>
          <View style={styles.sourceMetaRow}>
            <Text style={[styles.sourceUrl, { color: colors.textMuted }]} numberOfLines={1}>
              {item.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </Text>
            <Text style={[styles.storyCount, { color: colors.textSecondary }]}>
              {counts.total} {isArabic ? 'قصة' : 'stories'}
              {counts.week > 0 && (
                <Text style={{ color: colors.success }}> (+{counts.week})</Text>
              )}
            </Text>
          </View>
        </View>

        <View style={styles.sourceActions}>
          <Switch
            value={item.is_active}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={item.is_active ? colors.primary : colors.textMuted}
            style={styles.switch}
          />
        </View>
      </TouchableOpacity>
    );
  }, [colors, storyCountMap, isArabic]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'إدارة المصادر' : 'Manage Sources'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          {activeCount} {isArabic ? 'نشط من' : 'active of'} {sources.length}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <FontAwesome name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isArabic ? 'بحث...' : 'Search sources...'}
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        {/* Language Filter */}
        <View style={[styles.filterGroup, { backgroundColor: colors.surface }]}>
          {(['all', 'ar', 'en'] as LanguageFilter[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.filterOption,
                languageFilter === lang && { backgroundColor: colors.primary },
              ]}
              onPress={() => setLanguageFilter(lang)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: languageFilter === lang ? '#fff' : colors.textMuted },
                ]}
              >
                {lang === 'all' ? (isArabic ? 'الكل' : 'All') : lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort By */}
        <View style={[styles.filterGroup, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              sortBy === 'name' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSortBy('name')}
          >
            <FontAwesome
              name="sort-alpha-asc"
              size={14}
              color={sortBy === 'name' ? '#fff' : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              sortBy === 'stories' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSortBy('stories')}
          >
            <FontAwesome
              name="newspaper-o"
              size={14}
              color={sortBy === 'stories' ? '#fff' : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              sortBy === 'status' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSortBy('status')}
          >
            <FontAwesome
              name="toggle-on"
              size={14}
              color={sortBy === 'status' ? '#fff' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sources List */}
      <FlatList
        data={filteredSources}
        keyExtractor={(item) => item.id}
        renderItem={renderSourceItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="inbox" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {isArabic ? 'لا توجد مصادر' : 'No sources found'}
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <EditSourceModal
        source={editingSource}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingSource(null);
        }}
        onSave={handleSaveSource}
        isLoading={updateSourceMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: spacing.xs,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    borderRadius: borderRadius.sm,
    padding: 3,
  },
  filterOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    minWidth: 36,
    alignItems: 'center',
  },
  filterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  sourceLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sourceLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sourceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  languageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  languageText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
  },
  sourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sourceUrl: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  storyCount: {
    fontSize: fontSize.xs,
  },
  sourceActions: {
    marginLeft: spacing.sm,
  },
  switch: {
    transform: [{ scale: 0.85 }],
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: fontSize.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  modalSave: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  modalContent: {
    padding: spacing.lg,
  },
  logoPreviewContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
