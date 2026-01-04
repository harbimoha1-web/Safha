import { useQuery } from '@tanstack/react-query';
import { getViewedStories } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { STALE_TIME } from '@/constants/config';

export function useViewedStories() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['viewedStories', user?.id],
    queryFn: () => getViewedStories(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME,
  });
}
