import { useQuery } from '@tanstack/react-query';
import { getTopics } from '@/lib/api';
import { STALE_TIME } from '@/constants/config';

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
    staleTime: STALE_TIME * 2, // Topics change less frequently
  });
}
