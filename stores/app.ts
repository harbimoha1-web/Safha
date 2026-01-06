import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language, Theme, AppSettings, Topic } from '@/types';
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

  // Actions
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setTextSize: (size: 'small' | 'medium' | 'large') => void;
  setAutoPlayVideos: (enabled: boolean) => void;
  setSelectedTopics: (topics: Topic[]) => void;
  setAvailableTopics: (topics: Topic[]) => void;
  setOnboarded: (value: boolean) => void;
  setSurveyCompleted: (value: boolean) => void;
  setCurrentStoryIndex: (index: number) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        language: 'ar',
        theme: 'system',
        textSize: 'medium',
        autoPlayVideos: true,
      },
      selectedTopics: [],
      availableTopics: [],
      recentSearches: [],
      isOnboarded: false,
      hasSurveyCompleted: false,
      currentStoryIndex: 0,

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
      }),
    }
  )
);
