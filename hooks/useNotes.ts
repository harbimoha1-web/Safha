import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotes, createNote, updateNote, deleteNote } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { STALE_TIME } from '@/constants/config';

export function useNotes() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => getNotes(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ storyId, content }: { storyId: string; content: string }) =>
      createNote(user!.id, storyId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      updateNote(noteId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });
}
