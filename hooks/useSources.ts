import { useQuery } from '@tanstack/react-query';
import { getSources } from '@/lib/api';
import { STALE_TIME } from '@/constants/config';

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: STALE_TIME * 2, // Sources change less frequently
  });
}
