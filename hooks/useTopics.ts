import { useQuery } from '@tanstack/react-query';
import { getTopics } from '@/lib/api';
import { STALE_TIME } from '@/constants/config';

// Topics rarely change - use aggressive caching (30 minutes)
export const TOPICS_STALE_TIME = STALE_TIME * 6; // 30 minutes

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
    staleTime: TOPICS_STALE_TIME,
  });
}
