// Library Tab - Combines Saved + History with Segmented Control
// Reduces cognitive load by grouping user's content in one place

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { HistoryItemSkeleton } from '@/components/SkeletonLoader';
import { OptimizedImage } from '@/components/OptimizedImage';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore, useAuthStore, useSubscriptionStore } from '@/stores';
import { useSavedStories, useUnsaveStory, useViewedStories, useCreateNote, useUpdateNote, useNotes } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/Toast';
import type { SavedStory, Story } from '@/types';

type TabType = 'saved' | 'history';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedStory, setSelectedStory] = useState<{ id: string; title: string } | null>(null);
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { settings } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { isPremium } = useSubscriptionStore();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const isArabic = settings.language === 'ar';

  // Data hooks
  const {
    data: savedStories = [],
    isLoading: savedLoading,
    refetch: refetchSaved,
    isRefetching: savedRefreshing,
  } = useSavedStories();
  const unsaveStoryMutation = useUnsaveStory();

  const {
    data: historyStories = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
    isRefetching: historyRefreshing,
  } = useViewedStories();

  // Notes hooks (for adding/editing notes on saved stories)
  const { data: notes = [] } = useNotes();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();

  const isLoading = activeTab === 'saved' ? savedLoading : historyLoading;
  const isRefreshing = activeTab === 'saved' ? savedRefreshing : historyRefreshing;

  const onRefresh = useCallback(() => {
    if (activeTab === 'saved') {
      refetchSaved();
    } else {
      refetchHistory();
    }
  }, [activeTab, refetchSaved, refetchHistory]);

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const handleRemoveSaved = (item: SavedStory) => {
    unsaveStoryMutation.mutate(item.story_id);
  };

  const handleAddNote = (story: SavedStory) => {
    if (!story.story) return;

    // Premium gate: Notes feature requires صفحة+ subscription
    if (!isPremium) {
      router.push('/subscription');
      return;
    }

    // Check if a note already exists for this story
    const existingNote = notes.find((n) => n.story_id === story.story!.id);

    setSelectedStory({
      id: story.story.id,
      title: (isArabic ? story.story.title_ar : story.story.title_en) || story.story.original_title || 'Untitled',
    });
    setCurrentNote(existingNote?.content || '');
    setExistingNoteId(existingNote?.id || null);
    setSaveError(null); // Clear any previous error
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (!selectedStory || !currentNote.trim()) return;
    setSaveError(null); // Clear previous error

    const onSuccess = () => {
      setShowNoteModal(false);
      setCurrentNote('');
      setSelectedStory(null);
      setExistingNoteId(null);
      showToast({
        message: isArabic ? 'تم حفظ الملاحظة بنجاح' : 'Note saved successfully',
        type: 'success',
      });
    };

    const onError = (error: Error) => {
      const errorMessage = error.message || (isArabic ? 'فشل حفظ الملاحظة' : 'Failed to save note');
      setSaveError(errorMessage);
    };

    // Update existing note or create new one
    if (existingNoteId) {
      updateNoteMutation.mutate(
        { noteId: existingNoteId, content: currentNote.trim() },
        { onSuccess, onError }
      );
    } else {
      createNoteMutation.mutate(
        { storyId: selectedStory.id, content: currentNote.trim() },
        { onSuccess, onError }
      );
    }
  };

  // Render saved story item
  const renderSavedItem = ({ item }: { item: SavedStory }) => {
    if (!item.story) return null;

    return (
      <TouchableOpacity
        style={[styles.storyCard, { backgroundColor: colors.surface }]}
        onPress={() => handleStoryPress(item.story!.id)}
        accessibilityRole="button"
      >
        <OptimizedImage
          url={item.story.image_url}
          style={styles.storyImage}
          width={100}
          height={100}
          resizeMode="cover"
          fallbackIcon="bookmark"
        />
        <View style={styles.storyContent}>
          <Text style={[styles.storyTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]} numberOfLines={2}>
            {(isArabic ? item.story.title_ar : item.story.title_en) || item.story.original_title}
          </Text>
          <Text style={[styles.storyMeta, { color: colors.textMuted }]}>
            {new Date(item.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddNote(item)}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? (isPremium ? 'إضافة ملاحظة' : 'ميزة مدفوعة') : (isPremium ? 'Add note' : 'Premium feature')}
          >
            <View style={styles.noteButtonWrapper}>
              <FontAwesome name="pencil" size={18} color={isPremium ? colors.textMuted : colors.premium} />
              {!isPremium && (
                <FontAwesome name="star" size={10} color={colors.premium} style={styles.premiumBadge} />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveSaved(item)}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إزالة' : 'Remove'}
          >
            <FontAwesome name="bookmark" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render history item
  const renderHistoryItem = ({ item }: { item: Story }) => {
    return (
      <TouchableOpacity
        style={[styles.storyCard, { backgroundColor: colors.surface }]}
        onPress={() => handleStoryPress(item.id)}
        accessibilityRole="button"
      >
        <OptimizedImage
          url={item.image_url}
          style={styles.storyImage}
          width={100}
          height={100}
          resizeMode="cover"
          fallbackIcon="newspaper-o"
        />
        <View style={styles.storyContent}>
          <Text style={[styles.storyTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]} numberOfLines={2}>
            {(isArabic ? item.title_ar : item.title_en) || item.original_title}
          </Text>
          <View style={styles.metaRow}>
            {item.source && <Text style={[styles.sourceText, { color: colors.primary }]}>{item.source.name}</Text>}
            <Text style={[styles.storyMeta, { color: colors.textMuted }]}>
              {new Date(item.published_at || item.created_at).toLocaleDateString(
                isArabic ? 'ar-SA' : 'en-US',
                { month: 'short', day: 'numeric' }
              )}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
            {isArabic ? 'مكتبتي' : 'My Library'}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesome name="folder-open-o" size={64} color={colors.surfaceLight} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {isArabic ? 'سجل الدخول للوصول لمكتبتك' : 'Sign in to Access Your Library'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            {isArabic
              ? 'احفظ القصص وتتبع سجل قراءتك'
              : 'Save stories and track your reading history'}
          </Text>
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.signInButtonText, { color: colors.white }]}>
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getCurrentCount = () => {
    return activeTab === 'saved' ? savedStories.length : historyStories.length;
  };

  const renderEmptyState = () => {
    const icon: 'bookmark-o' | 'history' = activeTab === 'saved' ? 'bookmark-o' : 'history';
    const title = activeTab === 'saved'
      ? (isArabic ? 'لا توجد قصص محفوظة' : 'No Saved Stories')
      : (isArabic ? 'لا يوجد سجل قراءة' : 'No Reading History');
    const subtitle = activeTab === 'saved'
      ? (isArabic ? 'اضغط على أيقونة الحفظ لإضافة القصص' : 'Tap the bookmark icon to save stories')
      : (isArabic ? 'المقالات التي تقرأها ستظهر هنا' : 'Articles you read will appear here');

    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name={icon} size={48} color={colors.surfaceLight} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {isArabic ? 'مكتبتي' : 'My Library'}
        </Text>
      </View>

      {/* Segmented Control - 2 tabs */}
      <View style={[styles.segmentedControl, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'saved' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('saved')}
        >
          <FontAwesome
            name="bookmark"
            size={14}
            color={activeTab === 'saved' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.segmentText, { color: activeTab === 'saved' ? colors.primary : colors.textMuted }]}>
            {isArabic ? 'المحفوظات' : 'Saved'}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: activeTab === 'saved' ? colors.primary : colors.surfaceLight }]}>
            <Text style={[styles.countText, { color: activeTab === 'saved' ? colors.white : colors.textMuted }]}>
              {savedStories.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment, activeTab === 'history' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('history')}
        >
          <FontAwesome
            name="history"
            size={14}
            color={activeTab === 'history' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.segmentText, { color: activeTab === 'history' ? colors.primary : colors.textMuted }]}>
            {isArabic ? 'السجل' : 'History'}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: activeTab === 'history' ? colors.primary : colors.surfaceLight }]}>
            <Text style={[styles.countText, { color: activeTab === 'history' ? colors.white : colors.textMuted }]}>
              {historyStories.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map((i) => (
            <HistoryItemSkeleton key={`skeleton-${i}`} />
          ))}
        </ScrollView>
      ) : getCurrentCount() === 0 ? (
        renderEmptyState()
      ) : activeTab === 'saved' ? (
        <FlatList
          data={savedStories.filter(s => s && s.id)}
          renderItem={renderSavedItem}
          keyExtractor={(item, index) => `saved-${item?.id || 'item'}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={historyStories.filter(s => s && s.id)}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `history-${item?.id || 'item'}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Add Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNoteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {existingNoteId
                  ? (isArabic ? 'تعديل الملاحظة' : 'Edit Note')
                  : (isArabic ? 'إضافة ملاحظة' : 'Add Note')}
              </Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <FontAwesome name="times" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedStory && (
              <Text style={[styles.modalStoryTitle, { color: colors.primary }]} numberOfLines={2}>
                {selectedStory.title}
              </Text>
            )}

            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  borderColor: saveError ? colors.error : colors.border,
                },
                isArabic && styles.arabicText,
              ]}
              placeholder={isArabic ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
              placeholderTextColor={colors.textMuted}
              value={currentNote}
              onChangeText={(text) => {
                setCurrentNote(text);
                if (saveError) setSaveError(null); // Clear error on edit
              }}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {saveError && (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }, isArabic && styles.arabicText]}>
                  {saveError}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveNoteButton,
                { backgroundColor: currentNote.trim() && !createNoteMutation.isPending && !updateNoteMutation.isPending ? colors.primary : colors.surfaceLight },
              ]}
              onPress={handleSaveNote}
              disabled={!currentNote.trim() || createNoteMutation.isPending || updateNoteMutation.isPending}
            >
              <Text style={[styles.saveNoteButtonText, { color: colors.white }]}>
                {(createNoteMutation.isPending || updateNoteMutation.isPending)
                  ? (isArabic ? 'جارٍ الحفظ...' : 'Saving...')
                  : (isArabic ? 'حفظ الملاحظة' : 'Save Note')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  segmentText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  scrollContainer: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.lg,
  },
  storyCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  storyImage: {
    width: 100,
    height: 80,
  },
  storyContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  storyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  storyMeta: {
    fontSize: fontSize.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: spacing.sm,
    justifyContent: 'center',
  },
  noteButtonWrapper: {
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.xl,
  },
  signInButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  modalStoryTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  saveNoteButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveNoteButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: borderRadius.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
