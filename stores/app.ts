import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language, Theme, NewsFrequency, AppSettings, Topic, ContentLanguage } from '@/types';
import { MAX_RECENT_SEARCHES } from '@/constants/config';

interface AppState {
  // Settings
  settings: AppSettings;

  // Topics
  selectedTopics: Topic[];
  availableTopics: Topic[];

  // Search
  recentSearches: string[];

  // UI State
  isOnboarded: boolean;
  hasSurveyCompleted: boolean;
  currentStoryIndex: number;

  // Feed Filters
  activeFilters: string[];

  // Source Management - stores deselected sources (all enabled by default)
  deselectedSources: string[];

  // Local History - tracks seen stories for anonymous users (max 100)
  localHistory: string[];

  // Actions
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setTextSize: (size: 'small' | 'medium' | 'large') => void;
  setAutoPlayVideos: (enabled: boolean) => void;
  setNewsFrequency: (frequency: NewsFrequency) => void;
  setContentLanguage: (contentLanguage: ContentLanguage) => void;
  setSelectedTopics: (topics: Topic[]) => void;
  setAvailableTopics: (topics: Topic[]) => void;
  setOnboarded: (value: boolean) => void;
  setSurveyCompleted: (value: boolean) => void;
  setCurrentStoryIndex: (index: number) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setActiveFilters: (ids: string[]) => void;
  toggleActiveFilter: (id: string) => void;
  clearActiveFilters: () => void;
  // Source management actions
  toggleSourceSelection: (sourceId: string) => void;
  selectAllVisibleSources: (sourceIds: string[]) => void;
  deselectAllVisibleSources: (sourceIds: string[]) => void;
  toggleAllVisibleSources: (sourceIds: string[]) => void;
  resetSourceSelections: () => void;
  areAllSourcesSelected: (sourceIds: string[]) => boolean;
  // Local history actions
  addToLocalHistory: (storyId: string) => void;
  clearLocalHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        language: 'ar',
        theme: 'light',
        textSize: 'medium',
        autoPlayVideos: true,
        newsFrequency: null,
        contentLanguage: 'all',
      },
      selectedTopics: [],
      availableTopics: [],
      recentSearches: [],
      isOnboarded: false,
      hasSurveyCompleted: false,
      currentStoryIndex: 0,
      activeFilters: [],
      deselectedSources: [],
      localHistory: [],

      setLanguage: (language) =>
        set((state) => ({
          settings: { ...state.settings, language },
        })),

      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),

      setTextSize: (textSize) =>
        set((state) => ({
          settings: { ...state.settings, textSize },
        })),

      setAutoPlayVideos: (autoPlayVideos) =>
        set((state) => ({
          settings: { ...state.settings, autoPlayVideos },
        })),

      setNewsFrequency: (newsFrequency) =>
        set((state) => ({
          settings: { ...state.settings, newsFrequency },
        })),

      setContentLanguage: (contentLanguage) =>
        set((state) => ({
          settings: { ...state.settings, contentLanguage },
        })),

      setSelectedTopics: (selectedTopics) => set({ selectedTopics }),

      setAvailableTopics: (availableTopics) => set({ availableTopics }),

      setOnboarded: (isOnboarded) => set({ isOnboarded }),

      setSurveyCompleted: (hasSurveyCompleted) => set({ hasSurveyCompleted }),

      setCurrentStoryIndex: (currentStoryIndex) => set({ currentStoryIndex }),

      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed || trimmed.length < 2) return state;
          // Remove duplicate and add to front, keep max recent searches
          const filtered = state.recentSearches.filter((s) => s !== trimmed);
          return { recentSearches: [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES) };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      setActiveFilters: (activeFilters) => set({ activeFilters }),

      toggleActiveFilter: (id) =>
        set((state) => {
          const exists = state.activeFilters.includes(id);
          return {
            activeFilters: exists
              ? state.activeFilters.filter((f) => f !== id)
              : [...state.activeFilters, id],
          };
        }),

      clearActiveFilters: () => set({ activeFilters: [] }),

      // Source management actions
      toggleSourceSelection: (sourceId) =>
        set((state) => ({
          deselectedSources: state.deselectedSources.includes(sourceId)
            ? state.deselectedSources.filter((id) => id !== sourceId)
            : [...state.deselectedSources, sourceId],
        })),

      selectAllVisibleSources: (sourceIds) =>
        set((state) => ({
          deselectedSources: state.deselectedSources.filter(
            (id) => !sourceIds.includes(id)
          ),
        })),

      deselectAllVisibleSources: (sourceIds) =>
        set((state) => ({
          deselectedSources: [...new Set([...state.deselectedSources, ...sourceIds])],
        })),

      toggleAllVisibleSources: (sourceIds) =>
        set((state) => {
          // Check if all sources are currently selected (none in deselectedSources)
          const allSelected = sourceIds.every(
            (id) => !state.deselectedSources.includes(id)
          );

          if (allSelected) {
            // All are selected, so deselect all
            return {
              deselectedSources: [...new Set([...state.deselectedSources, ...sourceIds])],
            };
          } else {
            // Some or all are deselected, so select all
            return {
              deselectedSources: state.deselectedSources.filter(
                (id) => !sourceIds.includes(id)
              ),
            };
          }
        }),

      resetSourceSelections: () => set({ deselectedSources: [] }),

      areAllSourcesSelected: (sourceIds) => {
        const state = useAppStore.getState();
        return sourceIds.every((id) => !state.deselectedSources.includes(id));
      },

      // Local history - max 100 stories, newest first
      addToLocalHistory: (storyId) =>
        set((state) => {
          // Remove duplicate if exists, add to front, trim to 100
          const filtered = state.localHistory.filter((id) => id !== storyId);
          return { localHistory: [storyId, ...filtered].slice(0, 100) };
        }),

      clearLocalHistory: () => set({ localHistory: [] }),
    }),
    {
      name: 'safha-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        selectedTopics: state.selectedTopics,
        recentSearches: state.recentSearches,
        isOnboarded: state.isOnboarded,
        hasSurveyCompleted: state.hasSurveyCompleted,
        activeFilters: state.activeFilters,
        deselectedSources: state.deselectedSources,
        localHistory: state.localHistory,
      }),
    }
  )
);
