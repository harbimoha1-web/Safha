import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSavedStories, saveStory, unsaveStory } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { STALE_TIME } from '@/constants/config';

export function useSavedStories() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['savedStories', user?.id],
    queryFn: () => getSavedStories(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME,
  });
}

export function useSaveStory() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (storyId: string) => saveStory(user!.id, storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedStories', user?.id] });
    },
  });
}

export function useUnsaveStory() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (storyId: string) => unsaveStory(user!.id, storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedStories', user?.id] });
    },
  });
}
