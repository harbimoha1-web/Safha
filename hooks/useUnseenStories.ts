import { useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getUnseenStories } from '@/lib/api';
import { PAGE_SIZE, STALE_TIME } from '@/constants/config';
import { useBlockedSourceIds } from './useBlockedSources';
import { useAppStore, useAuthStore } from '@/stores';

/**
 * Fetch stories the user hasn't seen (no repeats)
 * Uses server-side filtering via RPC for efficiency
 * Also tracks session-seen stories for immediate hide on swipe
 */
export function useUnseenStories(topicIds?: string[]) {
  const { user } = useAuthStore();
  const { data: blockedSourceIds } = useBlockedSourceIds();
  const { settings } = useAppStore();
  const queryClient = useQueryClient();

  // Track session-seen stories locally for immediate feedback
  // (before server roundtrip completes)
  const sessionSeenRef = useRef<Set<string>>(new Set());

  const query = useInfiniteQuery({
    queryKey: ['unseenStories', user?.id, topicIds, blockedSourceIds, settings.contentLanguage],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('[useUnseenStories] queryFn called, user:', user?.id, 'topicIds:', topicIds, 'contentLanguage:', settings.contentLanguage);
      if (!user) {
        console.log('[useUnseenStories] No user, returning empty');
        return [];
      }

      const stories = await getUnseenStories(
        user.id,
        PAGE_SIZE,
        pageParam,
        topicIds,
        blockedSourceIds || [],
        settings.contentLanguage
      );

      console.log('[useUnseenStories] Got', stories.length, 'stories from API');

      // Filter out stories marked as seen in current session
      // (provides immediate feedback before next refetch)
      const filtered = stories.filter((s) => !sessionSeenRef.current.has(s.id));
      console.log('[useUnseenStories] After session filter:', filtered.length);
      return filtered;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: STALE_TIME,
    enabled: !!user,
  });

  // Clear session seen when user changes (logout/login different account)
  const prevUserIdRef = useRef(user?.id);
  if (user?.id !== prevUserIdRef.current) {
    sessionSeenRef.current.clear();
    prevUserIdRef.current = user?.id;
  }

  // Mark story as seen in current session (immediate hide)
  const markAsSeen = useCallback((storyId: string) => {
    sessionSeenRef.current.add(storyId);
  }, []);

  // Get count of session-seen stories
  const getSessionSeenCount = useCallback(() => {
    return sessionSeenRef.current.size;
  }, []);

  // Clear session seen and refetch (used when loading new stories)
  const refreshFeed = useCallback(() => {
    sessionSeenRef.current.clear();
    queryClient.invalidateQueries({ queryKey: ['unseenStories'] });
  }, [queryClient]);

  return {
    ...query,
    markAsSeen,
    refreshFeed,
    getSessionSeenCount,
  };
}
