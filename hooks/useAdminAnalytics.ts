import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminDashboardStats,
  getTopStoriesByEngagement,
  getSourcePerformance,
  getEngagementTrends,
  getAllTopics,
  updateTopic,
  getSourceStoryCounts,
} from '@/lib/api';
import type { Topic } from '@/types';

const ADMIN_STALE_TIME = 5 * 60 * 1000; // 5 minutes

// Dashboard stats - refetch every 5 minutes
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: getAdminDashboardStats,
    staleTime: ADMIN_STALE_TIME,
    refetchInterval: ADMIN_STALE_TIME,
  });
}

// Top stories by engagement
export function useTopStories(limit = 10, days = 7) {
  return useQuery({
    queryKey: ['admin', 'top-stories', { limit, days }],
    queryFn: () => getTopStoriesByEngagement(limit, days),
    staleTime: ADMIN_STALE_TIME,
  });
}

// Source performance
export function useSourcePerformance(limit = 20, days = 30) {
  return useQuery({
    queryKey: ['admin', 'source-performance', { limit, days }],
    queryFn: () => getSourcePerformance(limit, days),
    staleTime: ADMIN_STALE_TIME,
  });
}

// Engagement trends
export function useEngagementTrends(days = 14) {
  return useQuery({
    queryKey: ['admin', 'engagement-trends', { days }],
    queryFn: () => getEngagementTrends(days),
    staleTime: ADMIN_STALE_TIME,
  });
}

// All topics (including inactive) for admin
export function useAllTopics() {
  return useQuery({
    queryKey: ['admin', 'topics', 'all'],
    queryFn: getAllTopics,
    staleTime: ADMIN_STALE_TIME,
  });
}

// Update topic mutation with optimistic update
export function useUpdateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topicData: Partial<Topic>) => updateTopic(topicData),
    onMutate: async (newTopic) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'topics', 'all'] });

      // Snapshot previous value
      const previousTopics = queryClient.getQueryData(['admin', 'topics', 'all']);

      // Optimistically update
      queryClient.setQueryData(['admin', 'topics', 'all'], (old: Topic[] | undefined) =>
        old?.map((t) => (t.id === newTopic.id ? { ...t, ...newTopic } : t)) ?? []
      );

      return { previousTopics };
    },
    onError: (_err, _newTopic, context) => {
      // Rollback on error
      if (context?.previousTopics) {
        queryClient.setQueryData(['admin', 'topics', 'all'], context.previousTopics);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['admin', 'topics'] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
    },
  });
}

// Source story counts
export function useSourceStoryCounts() {
  return useQuery({
    queryKey: ['admin', 'source-story-counts'],
    queryFn: getSourceStoryCounts,
    staleTime: ADMIN_STALE_TIME,
  });
}
