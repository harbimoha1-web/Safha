import { useQuery } from '@tanstack/react-query';
import { getSources } from '@/lib/api';
import { STALE_TIME } from '@/constants/config';

// Sources rarely change - use aggressive caching (30 minutes)
export const SOURCES_STALE_TIME = STALE_TIME * 6; // 30 minutes

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: SOURCES_STALE_TIME,
  });
}
