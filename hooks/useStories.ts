import { useInfiniteQuery } from '@tanstack/react-query';
import { getStories } from '@/lib/api';
import { PAGE_SIZE, STALE_TIME } from '@/constants/config';

export function useStories(topicIds?: string[]) {
  return useInfiniteQuery({
    queryKey: ['stories', topicIds],
    queryFn: ({ pageParam = 0 }) => getStories(PAGE_SIZE, pageParam, topicIds),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: STALE_TIME,
  });
}
