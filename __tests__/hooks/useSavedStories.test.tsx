/**
 * useSavedStories Hook Tests
 * Tests saved stories fetching, save/unsave mutations
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSavedStories, useSavedStoryIds, useSaveStory, useUnsaveStory } from '@/hooks/useSavedStories';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  getSavedStories: jest.fn(),
  saveStory: jest.fn(),
  unsaveStory: jest.fn(),
}));

jest.mock('@/stores', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: 'user123' } })),
}));

import { getSavedStories, saveStory, unsaveStory } from '@/lib/api';
import { useAuthStore } from '@/stores';

const mockSavedStories = [
  { story_id: 'story1', saved_at: '2024-01-01T00:00:00Z' },
  { story_id: 'story2', saved_at: '2024-01-01T01:00:00Z' },
  { story_id: 'story3', saved_at: '2024-01-01T02:00:00Z' },
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

describe('useSavedStories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSavedStories as jest.Mock).mockResolvedValue(mockSavedStories);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should fetch saved stories for authenticated user', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSavedStories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSavedStories).toHaveBeenCalledWith('user123');
    expect(result.current.data).toEqual(mockSavedStories);
  });

  it('should not fetch when user is not authenticated', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSavedStories(), { wrapper });

    // Query should not be enabled
    expect(result.current.isFetching).toBe(false);
    expect(getSavedStories).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    (getSavedStories as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSavedStories(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useSavedStoryIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSavedStories as jest.Mock).mockResolvedValue(mockSavedStories);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should return a Set of saved story IDs', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSavedStoryIds(), { wrapper });

    await waitFor(() => expect(result.current.size).toBeGreaterThan(0));

    expect(result.current).toBeInstanceOf(Set);
    expect(result.current.has('story1')).toBe(true);
    expect(result.current.has('story2')).toBe(true);
    expect(result.current.has('story3')).toBe(true);
    expect(result.current.has('nonexistent')).toBe(false);
  });

  it('should return empty Set when no saved stories', async () => {
    (getSavedStories as jest.Mock).mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSavedStoryIds(), { wrapper });

    await waitFor(() => expect(result.current).toBeInstanceOf(Set));

    expect(result.current.size).toBe(0);
  });

  it('should return empty Set when user not authenticated', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSavedStoryIds(), { wrapper });

    expect(result.current).toBeInstanceOf(Set);
    expect(result.current.size).toBe(0);
  });
});

describe('useSaveStory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (saveStory as jest.Mock).mockResolvedValue({ success: true });
    (getSavedStories as jest.Mock).mockResolvedValue(mockSavedStories);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should save a story', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSaveStory(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('newStory');
    });

    expect(saveStory).toHaveBeenCalledWith('user123', 'newStory');
  });

  it('should handle save errors', async () => {
    (saveStory as jest.Mock).mockRejectedValue(new Error('Save failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSaveStory(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync('story1');
      })
    ).rejects.toThrow('Save failed');
  });
});

describe('useUnsaveStory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (unsaveStory as jest.Mock).mockResolvedValue({ success: true });
    (getSavedStories as jest.Mock).mockResolvedValue(mockSavedStories);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should unsave a story', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnsaveStory(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('story1');
    });

    expect(unsaveStory).toHaveBeenCalledWith('user123', 'story1');
  });

  it('should handle unsave errors', async () => {
    (unsaveStory as jest.Mock).mockRejectedValue(new Error('Unsave failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnsaveStory(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync('story1');
      })
    ).rejects.toThrow('Unsave failed');
  });
});
