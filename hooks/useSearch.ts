import { useQuery } from '@tanstack/react-query';
import { searchStories } from '@/lib/api';
import { STALE_TIME } from '@/constants/config';

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchStories(query),
    enabled: query.length >= 2,
    staleTime: STALE_TIME,
  });
}
