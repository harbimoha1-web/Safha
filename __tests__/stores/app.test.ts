import { act } from '@testing-library/react-native';
import { useAppStore } from '@/stores/app';

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({
    settings: {
      language: 'ar',
      theme: 'system',
      textSize: 'medium',
      autoPlayVideos: true,
      newsFrequency: null,
    },
    selectedTopics: [],
    availableTopics: [],
    recentSearches: [],
    isOnboarded: false,
    currentStoryIndex: 0,
    activeFilters: [],
  });
});

describe('useAppStore', () => {
  describe('initial state', () => {
    it('should have correct default settings', () => {
      const { settings } = useAppStore.getState();

      expect(settings.language).toBe('ar');
      expect(settings.theme).toBe('system');
      expect(settings.textSize).toBe('medium');
      expect(settings.autoPlayVideos).toBe(true);
    });

    it('should have empty topics and searches initially', () => {
      const state = useAppStore.getState();

      expect(state.selectedTopics).toEqual([]);
      expect(state.availableTopics).toEqual([]);
      expect(state.recentSearches).toEqual([]);
    });
  });

  describe('setLanguage', () => {
    it('should change language to English', () => {
      act(() => {
        useAppStore.getState().setLanguage('en');
      });

      expect(useAppStore.getState().settings.language).toBe('en');
    });

    it('should change language to Arabic', () => {
      // First set to English
      act(() => {
        useAppStore.getState().setLanguage('en');
      });

      // Then back to Arabic
      act(() => {
        useAppStore.getState().setLanguage('ar');
      });

      expect(useAppStore.getState().settings.language).toBe('ar');
    });

    it('should preserve other settings when changing language', () => {
      act(() => {
        useAppStore.getState().setTheme('dark');
        useAppStore.getState().setLanguage('en');
      });

      const { settings } = useAppStore.getState();
      expect(settings.language).toBe('en');
      expect(settings.theme).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('should change theme to dark', () => {
      act(() => {
        useAppStore.getState().setTheme('dark');
      });

      expect(useAppStore.getState().settings.theme).toBe('dark');
    });

    it('should change theme to light', () => {
      act(() => {
        useAppStore.getState().setTheme('light');
      });

      expect(useAppStore.getState().settings.theme).toBe('light');
    });

    it('should change theme to system', () => {
      act(() => {
        useAppStore.getState().setTheme('dark');
        useAppStore.getState().setTheme('system');
      });

      expect(useAppStore.getState().settings.theme).toBe('system');
    });
  });

  describe('setTextSize', () => {
    it('should change text size to small', () => {
      act(() => {
        useAppStore.getState().setTextSize('small');
      });

      expect(useAppStore.getState().settings.textSize).toBe('small');
    });

    it('should change text size to large', () => {
      act(() => {
        useAppStore.getState().setTextSize('large');
      });

      expect(useAppStore.getState().settings.textSize).toBe('large');
    });
  });

  describe('setAutoPlayVideos', () => {
    it('should disable auto play videos', () => {
      act(() => {
        useAppStore.getState().setAutoPlayVideos(false);
      });

      expect(useAppStore.getState().settings.autoPlayVideos).toBe(false);
    });

    it('should enable auto play videos', () => {
      act(() => {
        useAppStore.getState().setAutoPlayVideos(false);
        useAppStore.getState().setAutoPlayVideos(true);
      });

      expect(useAppStore.getState().settings.autoPlayVideos).toBe(true);
    });
  });

  describe('topics management', () => {
    const mockTopics = [
      { id: '1', name_en: 'Sports', name_ar: 'رياضة' },
      { id: '2', name_en: 'Tech', name_ar: 'تكنولوجيا' },
    ] as any[];

    it('should set selected topics', () => {
      act(() => {
        useAppStore.getState().setSelectedTopics(mockTopics);
      });

      expect(useAppStore.getState().selectedTopics).toEqual(mockTopics);
    });

    it('should set available topics', () => {
      act(() => {
        useAppStore.getState().setAvailableTopics(mockTopics);
      });

      expect(useAppStore.getState().availableTopics).toEqual(mockTopics);
    });
  });

  describe('recent searches', () => {
    it('should add a search query', () => {
      act(() => {
        useAppStore.getState().addRecentSearch('bitcoin');
      });

      expect(useAppStore.getState().recentSearches).toContain('bitcoin');
    });

    it('should not add empty or short queries', () => {
      act(() => {
        useAppStore.getState().addRecentSearch('');
        useAppStore.getState().addRecentSearch('a');
        useAppStore.getState().addRecentSearch('  ');
      });

      expect(useAppStore.getState().recentSearches).toHaveLength(0);
    });

    it('should trim whitespace from queries', () => {
      act(() => {
        useAppStore.getState().addRecentSearch('  bitcoin  ');
      });

      expect(useAppStore.getState().recentSearches[0]).toBe('bitcoin');
    });

    it('should prevent duplicate searches and move to front', () => {
      act(() => {
        useAppStore.getState().addRecentSearch('bitcoin');
        useAppStore.getState().addRecentSearch('ethereum');
        useAppStore.getState().addRecentSearch('bitcoin');
      });

      const searches = useAppStore.getState().recentSearches;
      expect(searches).toHaveLength(2);
      expect(searches[0]).toBe('bitcoin');
      expect(searches[1]).toBe('ethereum');
    });

    it('should limit to MAX_RECENT_SEARCHES', () => {
      // Add 15 searches (max is 10)
      act(() => {
        for (let i = 0; i < 15; i++) {
          useAppStore.getState().addRecentSearch(`search${i}`);
        }
      });

      expect(useAppStore.getState().recentSearches).toHaveLength(10);
      // Most recent should be first
      expect(useAppStore.getState().recentSearches[0]).toBe('search14');
    });

    it('should clear all recent searches', () => {
      act(() => {
        useAppStore.getState().addRecentSearch('bitcoin');
        useAppStore.getState().addRecentSearch('ethereum');
        useAppStore.getState().clearRecentSearches();
      });

      expect(useAppStore.getState().recentSearches).toHaveLength(0);
    });
  });

  describe('onboarding', () => {
    it('should set onboarded to true', () => {
      act(() => {
        useAppStore.getState().setOnboarded(true);
      });

      expect(useAppStore.getState().isOnboarded).toBe(true);
    });

    it('should set onboarded to false', () => {
      act(() => {
        useAppStore.getState().setOnboarded(true);
        useAppStore.getState().setOnboarded(false);
      });

      expect(useAppStore.getState().isOnboarded).toBe(false);
    });
  });

  describe('story navigation', () => {
    it('should set current story index', () => {
      act(() => {
        useAppStore.getState().setCurrentStoryIndex(5);
      });

      expect(useAppStore.getState().currentStoryIndex).toBe(5);
    });

    it('should update story index on navigation', () => {
      act(() => {
        useAppStore.getState().setCurrentStoryIndex(0);
        useAppStore.getState().setCurrentStoryIndex(1);
        useAppStore.getState().setCurrentStoryIndex(2);
      });

      expect(useAppStore.getState().currentStoryIndex).toBe(2);
    });
  });
});
