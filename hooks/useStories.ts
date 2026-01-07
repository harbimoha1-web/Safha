import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getStories, getStoriesByTopic } from '@/lib/api';
import { PAGE_SIZE, STALE_TIME } from '@/constants/config';
import { useBlockedSourceIds } from './useBlockedSources';
import { useAppStore } from '@/stores';

export function useStories(topicIds?: string[]) {
  const { data: blockedSourceIds } = useBlockedSourceIds();
  const { deselectedSources } = useAppStore();

  // Combine blocked sources (server) with deselected sources (client)
  const excludedSourceIds = useMemo(() => {
    const blocked = blockedSourceIds || [];
    return [...new Set([...blocked, ...deselectedSources])];
  }, [blockedSourceIds, deselectedSources]);

  return useInfiniteQuery({
    queryKey: ['stories', topicIds, excludedSourceIds],
    queryFn: ({ pageParam = 0 }) => getStories(PAGE_SIZE, pageParam, topicIds, excludedSourceIds),
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
