import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { useAllTopics, useUpdateTopic } from '@/hooks/useAdminAnalytics';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { Topic } from '@/types';

const ICON_OPTIONS = [
  'newspaper-o', 'dollar', 'futbol-o', 'laptop', 'film', 'heartbeat',
  'flask', 'plane', 'briefcase', 'globe', 'car', 'home', 'graduation-cap',
  'music', 'camera', 'book', 'shopping-cart', 'star', 'trophy', 'users',
];

const COLOR_OPTIONS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function TopicsScreen() {
  const { colors } = useTheme();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  const { data: topics = [], isLoading } = useAllTopics();
  const updateTopicMutation = useUpdateTopic();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editForm, setEditForm] = useState({
    name_ar: '',
    name_en: '',
    slug: '',
    icon: '',
    color: '',
    is_active: true,
    sort_order: 0,
  });

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(
      (t) =>
        t.name_en.toLowerCase().includes(query) ||
        t.name_ar.toLowerCase().includes(query) ||
        t.slug.toLowerCase().includes(query)
    );
  }, [topics, searchQuery]);

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setEditForm({
      name_ar: topic.name_ar,
      name_en: topic.name_en,
      slug: topic.slug,
      icon: topic.icon || '',
      color: topic.color || '',
      is_active: topic.is_active,
      sort_order: topic.sort_order || 0,
    });
  };

  const handleSaveTopic = async () => {
    if (!editingTopic) return;

    try {
      await updateTopicMutation.mutateAsync({
        id: editingTopic.id,
        ...editForm,
      });
      setEditingTopic(null);
      Alert.alert(
        isArabic ? 'تم الحفظ' : 'Saved',
        isArabic ? 'تم تحديث الموضوع بنجاح' : 'Topic updated successfully'
      );
    } catch (error) {
      Alert.alert(
        isArabic ? 'خطأ' : 'Error',
        isArabic ? 'فشل في تحديث الموضوع' : 'Failed to update topic'
      );
    }
  };

  const handleToggleActive = async (topic: Topic) => {
    try {
      await updateTopicMutation.mutateAsync({
        id: topic.id,
        is_active: !topic.is_active,
      });
    } catch (error) {
      Alert.alert(
        isArabic ? 'خطأ' : 'Error',
        isArabic ? 'فشل في تغيير حالة الموضوع' : 'Failed to toggle topic status'
      );
    }
  };

  const renderTopicItem = ({ item: topic }: { item: Topic }) => {
    const topicIcon = topic.icon || getTopicIcon(topic.slug);
    const topicColor = topic.color || getTopicColor(topic.slug);

    return (
      <View style={[styles.topicItem, { backgroundColor: colors.surface }]}>
        <View style={[styles.topicIcon, { backgroundColor: `${topicColor}20` }]}>
          <FontAwesome name={topicIcon as any} size={18} color={topicColor} />
        </View>

        <View style={styles.topicInfo}>
          <Text style={[styles.topicName, { color: colors.textPrimary }]}>
            {isArabic ? topic.name_ar : topic.name_en}
          </Text>
          <Text style={[styles.topicSlug, { color: colors.textMuted }]}>
            {topic.slug} | Order: {topic.sort_order}
          </Text>
        </View>

        <View style={styles.topicActions}>
          <Switch
            value={topic.is_active}
            onValueChange={() => handleToggleActive(topic)}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={topic.is_active ? colors.primary : colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => handleEditTopic(topic)}
          >
            <FontAwesome name="pencil" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'إدارة المواضيع' : 'Manage Topics'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          {topics.filter((t) => t.is_active).length} {isArabic ? 'نشط من' : 'active of'} {topics.length}
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <FontAwesome name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={isArabic ? 'بحث...' : 'Search topics...'}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Topics List */}
      <FlatList
        data={filteredTopics}
        keyExtractor={(item) => item.id}
        renderItem={renderTopicItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Modal */}
      <Modal
        visible={!!editingTopic}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingTopic(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingTopic(null)}>
              <FontAwesome name="times" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isArabic ? 'تعديل الموضوع' : 'Edit Topic'}
            </Text>
            <TouchableOpacity
              onPress={handleSaveTopic}
              disabled={updateTopicMutation.isPending}
            >
              {updateTopicMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.saveButton, { color: colors.primary }]}>
                  {isArabic ? 'حفظ' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name AR */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {isArabic ? 'الاسم بالعربية' : 'Arabic Name'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              value={editForm.name_ar}
              onChangeText={(text) => setEditForm((f) => ({ ...f, name_ar: text }))}
              placeholder="اسم الموضوع"
              placeholderTextColor={colors.textMuted}
            />

            {/* Name EN */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {isArabic ? 'الاسم بالإنجليزية' : 'English Name'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              value={editForm.name_en}
              onChangeText={(text) => setEditForm((f) => ({ ...f, name_en: text }))}
              placeholder="Topic name"
              placeholderTextColor={colors.textMuted}
            />

            {/* Slug */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>Slug</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              value={editForm.slug}
              onChangeText={(text) => setEditForm((f) => ({ ...f, slug: text.toLowerCase().replace(/\s/g, '-') }))}
              placeholder="topic-slug"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            {/* Sort Order */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {isArabic ? 'ترتيب العرض' : 'Sort Order'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              value={editForm.sort_order.toString()}
              onChangeText={(text) => setEditForm((f) => ({ ...f, sort_order: parseInt(text) || 0 }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />

            {/* Active Toggle */}
            <View style={styles.toggleRow}>
              <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 0 }]}>
                {isArabic ? 'نشط' : 'Active'}
              </Text>
              <Switch
                value={editForm.is_active}
                onValueChange={(value) => setEditForm((f) => ({ ...f, is_active: value }))}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={editForm.is_active ? colors.primary : colors.textMuted}
              />
            </View>

            {/* Icon Picker */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {isArabic ? 'الأيقونة' : 'Icon'}
            </Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    { backgroundColor: colors.surface },
                    editForm.icon === icon && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setEditForm((f) => ({ ...f, icon }))}
                >
                  <FontAwesome
                    name={icon as any}
                    size={18}
                    color={editForm.icon === icon ? '#fff' : colors.textPrimary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Picker */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {isArabic ? 'اللون' : 'Color'}
            </Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    editForm.color === color && styles.colorSelected,
                  ]}
                  onPress={() => setEditForm((f) => ({ ...f, color }))}
                >
                  {editForm.color === color && (
                    <FontAwesome name="check" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {isArabic ? 'معاينة' : 'Preview'}
            </Text>
            <View style={[styles.preview, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: `${editForm.color || '#3B82F6'}20` },
                ]}
              >
                <FontAwesome
                  name={(editForm.icon || 'tag') as any}
                  size={20}
                  color={editForm.color || '#3B82F6'}
                />
              </View>
              <View>
                <Text style={[styles.previewName, { color: colors.textPrimary }]}>
                  {editForm.name_en || 'Topic Name'}
                </Text>
                <Text style={[styles.previewNameAr, { color: colors.textMuted }]}>
                  {editForm.name_ar || 'اسم الموضوع'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
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
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  topicSlug: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  topicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  saveButton: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  modalContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  previewNameAr: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
