import { useQuery } from '@tanstack/react-query';
import { getTopicSourceMapping } from '@/lib/api';
import { STALE_TIME } from '@/constants/config';

export function useTopicSourceMapping() {
  return useQuery({
    queryKey: ['topicSourceMapping'],
    queryFn: getTopicSourceMapping,
    staleTime: STALE_TIME * 4, // This data changes infrequently
  });
}
