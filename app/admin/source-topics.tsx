import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { getSourceLogo } from '@/lib/image';
import { useAllSources, useTopics, useSourceTopics, useUpdateSourceTopics } from '@/hooks';
import type { Source, Topic } from '@/types';

interface AssignModalProps {
  source: Source | null;
  visible: boolean;
  onClose: () => void;
  topics: Topic[];
  currentTopicIds: string[];
  onSave: (topicIds: string[]) => void;
  isLoading: boolean;
}

function AssignTopicsModal({
  source,
  visible,
  onClose,
  topics,
  currentTopicIds,
  onSave,
  isLoading,
}: AssignModalProps) {
  const { colors } = useTheme();
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set(currentTopicIds));

  // Reset selection when modal opens with new source
  useState(() => {
    setSelectedTopics(new Set(currentTopicIds));
  });

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selectedTopics));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Assign Topics
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {source && (
          <View style={[styles.sourcePreview, { backgroundColor: colors.surface }]}>
            {getSourceLogo(source.url, source.logo_url) ? (
              <Image
                source={{ uri: getSourceLogo(source.url, source.logo_url)! }}
                style={styles.sourcePreviewLogo}
              />
            ) : (
              <View style={[styles.sourcePreviewPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                <FontAwesome name="newspaper-o" size={24} color={colors.textMuted} />
              </View>
            )}
            <Text style={[styles.sourcePreviewName, { color: colors.textPrimary }]}>
              {source.name}
            </Text>
          </View>
        )}

        <ScrollView style={styles.topicsList} contentContainerStyle={styles.topicsContent}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Select topics for this source ({selectedTopics.size} selected)
          </Text>

          {topics.map((topic) => {
            const isSelected = selectedTopics.has(topic.id);
            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicItem,
                  { backgroundColor: colors.surface },
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => toggleTopic(topic.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.topicIcon, { backgroundColor: topic.color || colors.primary }]}>
                  <FontAwesome name={topic.icon as any || 'tag'} size={16} color="#fff" />
                </View>
                <View style={styles.topicInfo}>
                  <Text style={[styles.topicName, { color: colors.textPrimary }]}>
                    {topic.name_en}
                  </Text>
                  <Text style={[styles.topicNameAr, { color: colors.textMuted }]}>
                    {topic.name_ar}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                >
                  {isSelected && <FontAwesome name="check" size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SourceTopicsManagement() {
  const { colors } = useTheme();
  const { data: sources = [], isLoading: loadingSources } = useAllSources();
  const { data: topics = [], isLoading: loadingTopics } = useTopics();
  const { data: sourceTopics = [], isLoading: loadingAssignments } = useSourceTopics();
  const updateSourceTopicsMutation = useUpdateSourceTopics();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Create a map of source ID -> topic IDs
  const sourceTopicsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    sourceTopics.forEach((item) => {
      map.set(item.source_id, item.topic_ids);
    });
    return map;
  }, [sourceTopics]);

  // Filter sources by search query
  const filteredSources = sources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditSource = (source: Source) => {
    setEditingSource(source);
    setModalVisible(true);
  };

  const handleSaveTopics = async (topicIds: string[]) => {
    if (!editingSource) return;

    try {
      await updateSourceTopicsMutation.mutateAsync({
        sourceId: editingSource.id,
        topicIds,
      });
      setModalVisible(false);
      setEditingSource(null);
      Alert.alert('Success', 'Source topics updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update source topics');
    }
  };

  const getTopicCount = (sourceId: string): number => {
    return sourceTopicsMap.get(sourceId)?.length || 0;
  };

  const renderSourceItem = useCallback(
    ({ item }: { item: Source }) => {
      const logoUrl = getSourceLogo(item.url, item.logo_url);
      const topicCount = getTopicCount(item.id);

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
            <Text style={[styles.sourceName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.topicBadge}>
              <FontAwesome name="tags" size={12} color={colors.textMuted} />
              <Text style={[styles.topicCountText, { color: colors.textMuted }]}>
                {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
              </Text>
            </View>
          </View>
          <View style={styles.sourceStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.is_active ? '#10B981' : '#EF4444' },
              ]}
            />
            <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      );
    },
    [colors, sourceTopicsMap]
  );

  const isLoading = loadingSources || loadingTopics || loadingAssignments;

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <FontAwesome name="info-circle" size={18} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          Assign topics to sources. Sources will appear under their assigned topics in the Explore tab.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <FontAwesome name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search sources..."
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
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
              No sources found
            </Text>
          </View>
        }
      />

      {/* Assign Topics Modal */}
      <AssignTopicsModal
        source={editingSource}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingSource(null);
        }}
        topics={topics}
        currentTopicIds={editingSource ? sourceTopicsMap.get(editingSource.id) || [] : []}
        onSave={handleSaveTopics}
        isLoading={updateSourceTopicsMutation.isPending}
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    marginTop: 0,
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
  list: {
    padding: spacing.md,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sourceLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sourceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  topicCountText: {
    fontSize: fontSize.sm,
  },
  sourceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  sourcePreview: {
    alignItems: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sourcePreviewLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.sm,
  },
  sourcePreviewPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sourcePreviewName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  topicsList: {
    flex: 1,
  },
  topicsContent: {
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topicName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  topicNameAr: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
