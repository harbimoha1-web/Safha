/**
 * useStories Hook Tests
 * Tests story fetching with infinite query and topic filtering
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useStories, useStoriesByTopic } from '@/hooks/useStories';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  getStories: jest.fn(),
  getStoriesByTopic: jest.fn(),
}));

jest.mock('@/hooks/useBlockedSources', () => ({
  useBlockedSourceIds: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/stores', () => ({
  useAppStore: jest.fn(() => ({
    deselectedSources: [],
    settings: { contentLanguage: 'all' },
    localHistory: [],
  })),
  useAuthStore: jest.fn(() => ({ user: null })),
}));

import { getStories, getStoriesByTopic } from '@/lib/api';
import { useBlockedSourceIds } from '@/hooks/useBlockedSources';
import { useAppStore } from '@/stores';

const mockStories = [
  {
    id: '1',
    title_en: 'Story 1',
    title_ar: 'خبر 1',
    summary_en: 'Summary 1',
    summary_ar: 'ملخص 1',
    topic_ids: ['tech'],
    source: { id: 's1', name: 'Source 1' },
    created_at: '2024-01-01T00:00:00Z',
    published_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title_en: 'Story 2',
    title_ar: 'خبر 2',
    summary_en: 'Summary 2',
    summary_ar: 'ملخص 2',
    topic_ids: ['tech'],
    source: { id: 's2', name: 'Source 2' },
    created_at: '2024-01-01T01:00:00Z',
    published_at: '2024-01-01T01:00:00Z',
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

describe('useStories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getStories as jest.Mock).mockResolvedValue(mockStories);
    (useBlockedSourceIds as jest.Mock).mockReturnValue({ data: [] });
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      deselectedSources: [],
      settings: { contentLanguage: 'all' },
      localHistory: [],
    });
  });

  it('should fetch stories on mount', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useStories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStories).toHaveBeenCalled();
    expect(result.current.data?.pages[0]).toEqual(mockStories);
  });

  it('should include query key with topicIds', async () => {
    const wrapper = createWrapper();
    const topicIds = ['tech', 'science'];

    const { result } = renderHook(() => useStories(topicIds), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStories).toHaveBeenCalledWith(
      expect.any(Number), // PAGE_SIZE
      0, // initial offset
      topicIds,
      [], // excluded sources
      'all' // contentLanguage
    );
  });

  it('should exclude blocked sources from query', async () => {
    const blockedIds = ['blocked1', 'blocked2'];
    (useBlockedSourceIds as jest.Mock).mockReturnValue({ data: blockedIds });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useStories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStories).toHaveBeenCalledWith(
      expect.any(Number),
      0,
      undefined,
      blockedIds,
      'all' // contentLanguage
    );
  });

  it('should use blocked sources from API', async () => {
    const blockedIds = ['blocked1'];
    (useBlockedSourceIds as jest.Mock).mockReturnValue({ data: blockedIds });
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      deselectedSources: [],
      settings: { contentLanguage: 'all' },
      localHistory: [],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useStories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should pass blocked sources to API
    expect(getStories).toHaveBeenCalledWith(
      expect.any(Number),
      0,
      undefined,
      blockedIds,
      'all' // contentLanguage
    );
  });

  it('should pass multiple blocked sources to API', async () => {
    const blockedIds = ['source1', 'source2'];
    (useBlockedSourceIds as jest.Mock).mockReturnValue({ data: blockedIds });
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      deselectedSources: [],
      settings: { contentLanguage: 'all' },
      localHistory: [],
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useStories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callArgs = (getStories as jest.Mock).mock.calls[0];
    const excludedSources = callArgs[3];

    // Should pass the blocked IDs as-is
    expect(excludedSources).toHaveLength(2);
    expect(excludedSources).toEqual(blockedIds);
  });

  it('should handle fetch errors', async () => {
    (getStories as jest.Mock).mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useStories(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should handle empty blocked sources', async () => {
    (useBlockedSourceIds as jest.Mock).mockReturnValue({ data: undefined });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useStories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStories).toHaveBeenCalledWith(
      expect.any(Number),
      0,
      undefined,
      expect.any(Array),
      'all' // contentLanguage
    );
  });
});

describe('useStoriesByTopic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getStoriesByTopic as jest.Mock).mockResolvedValue(mockStories);
  });

  it('should fetch stories for a specific topic', async () => {
    const wrapper = createWrapper();
    const topicId = 'tech';

    const { result } = renderHook(() => useStoriesByTopic(topicId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStoriesByTopic).toHaveBeenCalledWith(topicId, 50);
    expect(result.current.data).toEqual(mockStories);
  });

  it('should not fetch when topicId is undefined', async () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoriesByTopic(undefined), { wrapper });

    // Should not trigger fetch
    expect(result.current.isFetching).toBe(false);
    expect(getStoriesByTopic).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    (getStoriesByTopic as jest.Mock).mockRejectedValue(new Error('Topic not found'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useStoriesByTopic('invalid'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
