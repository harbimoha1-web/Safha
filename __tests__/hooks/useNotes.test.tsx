/**
 * useNotes Hook Tests
 * Tests notes CRUD operations
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  getNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));

jest.mock('@/stores', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: 'user123' } })),
}));

import { getNotes, createNote, updateNote, deleteNote } from '@/lib/api';
import { useAuthStore } from '@/stores';

const mockNotes = [
  {
    id: 'note1',
    story_id: 'story1',
    content: 'This is a great article',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'note2',
    story_id: 'story2',
    content: 'Interesting perspective',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper component for React Query
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getNotes as jest.Mock).mockResolvedValue(mockNotes);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should fetch notes for authenticated user', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getNotes).toHaveBeenCalledWith('user123');
    expect(result.current.data).toEqual(mockNotes);
  });

  it('should not fetch when user is not authenticated', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(getNotes).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    (getNotes as jest.Mock).mockRejectedValue(new Error('Failed to fetch notes'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should return empty array when no notes', async () => {
    (getNotes as jest.Mock).mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('useCreateNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createNote as jest.Mock).mockResolvedValue({ id: 'newNote', content: 'New note content' });
    (getNotes as jest.Mock).mockResolvedValue(mockNotes);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should create a note', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        storyId: 'story3',
        content: 'New note content',
      });
    });

    expect(createNote).toHaveBeenCalledWith('user123', 'story3', 'New note content');
  });

  it('should handle create errors', async () => {
    (createNote as jest.Mock).mockRejectedValue(new Error('Create failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateNote(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          storyId: 'story3',
          content: 'New note',
        });
      })
    ).rejects.toThrow('Create failed');
  });

  it('should handle empty content', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        storyId: 'story3',
        content: '',
      });
    });

    expect(createNote).toHaveBeenCalledWith('user123', 'story3', '');
  });

  it('should handle long content', async () => {
    const longContent = 'A'.repeat(5000);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        storyId: 'story3',
        content: longContent,
      });
    });

    expect(createNote).toHaveBeenCalledWith('user123', 'story3', longContent);
  });
});

describe('useUpdateNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateNote as jest.Mock).mockResolvedValue({ id: 'note1', content: 'Updated content' });
    (getNotes as jest.Mock).mockResolvedValue(mockNotes);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should update a note', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        noteId: 'note1',
        content: 'Updated content',
      });
    });

    expect(updateNote).toHaveBeenCalledWith('note1', 'Updated content');
  });

  it('should handle update errors', async () => {
    (updateNote as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateNote(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          noteId: 'note1',
          content: 'Updated',
        });
      })
    ).rejects.toThrow('Update failed');
  });
});

describe('useDeleteNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (deleteNote as jest.Mock).mockResolvedValue({ success: true });
    (getNotes as jest.Mock).mockResolvedValue(mockNotes);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should delete a note', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteNote(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('note1');
    });

    expect(deleteNote).toHaveBeenCalledWith('note1');
  });

  it('should handle delete errors', async () => {
    (deleteNote as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteNote(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync('note1');
      })
    ).rejects.toThrow('Delete failed');
  });

  it('should handle deleting non-existent note', async () => {
    (deleteNote as jest.Mock).mockRejectedValue(new Error('Note not found'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteNote(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync('nonexistent');
      })
    ).rejects.toThrow('Note not found');
  });
});
