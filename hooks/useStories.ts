import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getStories, getStoriesByTopic } from '@/lib/api';
import { PAGE_SIZE, STALE_TIME } from '@/constants/config';
import { useBlockedSourceIds } from './useBlockedSources';
import { useAppStore, useAuthStore } from '@/stores';

export function useStories(topicIds?: string[]) {
  const { data: blockedSourceIds } = useBlockedSourceIds();
  const { settings, localHistory } = useAppStore();
  const { user } = useAuthStore();

  return useInfiniteQuery({
    queryKey: ['stories', topicIds, blockedSourceIds, settings.contentLanguage, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const stories = await getStories(
        PAGE_SIZE,
        pageParam,
        topicIds,
        blockedSourceIds || [],
        settings.contentLanguage
      );
      // Only filter by localHistory for anonymous users
      // Logged-in users in Explore mode should see ALL stories
      if (!user) {
        return stories.filter((s) => !localHistory.includes(s.id));
      }
      return stories;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: STALE_TIME,
  });
}

export function useStoriesByTopic(topicId: string | undefined) {
  return useQuery({
    queryKey: ['storiesByTopic', topicId],
    queryFn: () => getStoriesByTopic(topicId!, 50),
    enabled: !!topicId,
    staleTime: STALE_TIME,
  });
}
