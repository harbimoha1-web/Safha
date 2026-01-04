import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language, Theme, AppSettings, Topic } from '@/types';

interface AppState {
  // Settings
  settings: AppSettings;

  // Topics
  selectedTopics: Topic[];
  availableTopics: Topic[];

  // UI State
  isOnboarded: boolean;
  currentStoryIndex: number;

  // Actions
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setTextSize: (size: 'small' | 'medium' | 'large') => void;
  setAutoPlayVideos: (enabled: boolean) => void;
  setSelectedTopics: (topics: Topic[]) => void;
  setAvailableTopics: (topics: Topic[]) => void;
  setOnboarded: (value: boolean) => void;
  setCurrentStoryIndex: (index: number) => void;
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
      isOnboarded: false,
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

      setCurrentStoryIndex: (currentStoryIndex) => set({ currentStoryIndex }),
    }),
    {
      name: 'teller-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        selectedTopics: state.selectedTopics,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
