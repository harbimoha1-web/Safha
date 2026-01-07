import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlockedSources, getBlockedSourceIds, blockSource, unblockSource } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { STALE_TIME } from '@/constants/config';

export function useBlockedSources() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['blockedSources', user?.id],
    queryFn: () => getBlockedSources(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME,
  });
}

export function useBlockedSourceIds() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['blockedSourceIds', user?.id],
    queryFn: () => getBlockedSourceIds(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME,
  });
}

export function useBlockSource() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (sourceId: string) => blockSource(user!.id, sourceId),
    onSuccess: () => {
      // Invalidate blocked sources queries
      queryClient.invalidateQueries({ queryKey: ['blockedSources', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['blockedSourceIds', user?.id] });
      // Invalidate stories to refresh feed
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useUnblockSource() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (sourceId: string) => unblockSource(user!.id, sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedSources', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['blockedSourceIds', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
