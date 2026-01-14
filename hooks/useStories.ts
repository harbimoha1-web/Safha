import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getStories, getStoriesByTopic } from '@/lib/api';
import { PAGE_SIZE, STALE_TIME } from '@/constants/config';
import { useBlockedSourceIds } from './useBlockedSources';
import { useAppStore } from '@/stores';

export function useStories(topicIds?: string[]) {
  const { data: blockedSourceIds } = useBlockedSourceIds();
  const { settings, localHistory } = useAppStore();

  return useInfiniteQuery({
    queryKey: ['stories', topicIds, blockedSourceIds, settings.contentLanguage],
    queryFn: async ({ pageParam = 0 }) => {
      const stories = await getStories(
        PAGE_SIZE,
        pageParam,
        topicIds,
        blockedSourceIds || [],
        settings.contentLanguage
      );
      // Filter out stories already in local history (no repeats for anonymous users)
      return stories.filter((s) => !localHistory.includes(s.id));
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
