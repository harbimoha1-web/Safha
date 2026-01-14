import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNewStoryCount } from '@/lib/api';
import { useAuthStore } from '@/stores';

// Poll interval: 2 minutes
const POLL_INTERVAL = 2 * 60 * 1000;

/**
 * Poll for new stories since last check
 * Returns count and "X new stories" badge state
 */
export function useNewStoryPolling(topicIds?: string[]) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Track when user last acknowledged new stories
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const [newStoryCount, setNewStoryCount] = useState(0);

  // Poll for new stories every 2 minutes
  // Note: lastCheckRef is NOT in queryKey (mutable refs cause excessive refetches)
  // Instead, the query uses the current ref value on each poll
  const { data, error, isError } = useQuery({
    queryKey: ['newStoryCount', user?.id, topicIds],
    queryFn: async () => {
      if (!user) return 0;
      return getNewStoryCount(user.id, lastCheckRef.current, topicIds);
    },
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false, // Don't poll when app is backgrounded
    enabled: !!user,
    staleTime: 0, // Always refetch when interval triggers
  });

  // Log polling errors for debugging
  if (isError && error) {
    console.warn('[useNewStoryPolling] Polling error:', error);
  }

  // Update count when data changes
  useEffect(() => {
    if (data !== undefined && data > 0) {
      setNewStoryCount(data);
    }
  }, [data]);

  // Reset count and timestamp when user views new stories
  const acknowledgeNewStories = useCallback(() => {
    lastCheckRef.current = new Date().toISOString();
    setNewStoryCount(0);
    // Invalidate unseen stories to trigger refetch with new content
    queryClient.invalidateQueries({ queryKey: ['unseenStories'] });
    // Also invalidate the count query
    queryClient.invalidateQueries({ queryKey: ['newStoryCount'] });
  }, [queryClient]);

  // Reset timestamp on mount and when user changes (login/logout)
  useEffect(() => {
    lastCheckRef.current = new Date().toISOString();
  }, [user?.id]);

  return {
    newStoryCount,
    hasNewStories: newStoryCount > 0,
    acknowledgeNewStories,
  };
}
