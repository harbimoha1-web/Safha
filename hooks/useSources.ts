import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSources, getAllSources, updateSource, getSourceTopics, updateSourceTopics } from '@/lib/api';
import { STALE_TIME } from '@/constants/config';
import type { Source } from '@/types';

// Sources rarely change - use aggressive caching (30 minutes)
export const SOURCES_STALE_TIME = STALE_TIME * 6; // 30 minutes

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
    staleTime: SOURCES_STALE_TIME,
  });
}

// Get all sources including inactive (for admin)
export function useAllSources() {
  return useQuery({
    queryKey: ['sources', 'all'],
    queryFn: getAllSources,
    staleTime: SOURCES_STALE_TIME,
  });
}

// Update source mutation (for admin)
export function useUpdateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceData: Partial<Source>) => updateSource(sourceData),
    onSuccess: () => {
      // Invalidate sources queries to refetch
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });
}

// Get source-topic assignments (for admin)
export function useSourceTopics() {
  return useQuery({
    queryKey: ['source-topics'],
    queryFn: getSourceTopics,
    staleTime: SOURCES_STALE_TIME,
  });
}

// Update source-topic assignments mutation (for admin)
export function useUpdateSourceTopics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, topicIds }: { sourceId: string; topicIds: string[] }) =>
      updateSourceTopics(sourceId, topicIds),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['source-topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic-source-mapping'] });
    },
  });
}
