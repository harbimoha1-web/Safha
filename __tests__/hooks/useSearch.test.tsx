/**
 * useSearch Hook Tests
 * Tests search functionality with query validation
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSearch } from '@/hooks/useSearch';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  searchStories: jest.fn(),
}));

import { searchStories } from '@/lib/api';

const mockSearchResults = [
  {
    id: '1',
    title_en: 'Technology News',
    title_ar: 'أخبار التقنية',
    summary_en: 'Latest tech updates',
    summary_ar: 'آخر تحديثات التقنية',
    topic_ids: ['tech'],
    source: { id: 's1', name: 'Tech Source' },
    rank: 0.9,
  },
  {
    id: '2',
    title_en: 'Tech Innovation',
    title_ar: 'ابتكار تقني',
    summary_en: 'New innovations in tech',
    summary_ar: 'ابتكارات جديدة في التقنية',
    topic_ids: ['tech'],
    source: { id: 's2', name: 'Innovation Daily' },
    rank: 0.8,
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

describe('useSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (searchStories as jest.Mock).mockResolvedValue(mockSearchResults);
  });

  it('should search stories with valid query', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch('technology'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(searchStories).toHaveBeenCalledWith('technology');
    expect(result.current.data).toEqual(mockSearchResults);
  });

  it('should not search with query less than 2 characters', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch('a'), { wrapper });

    // Query should not be enabled
    expect(result.current.isFetching).toBe(false);
    expect(searchStories).not.toHaveBeenCalled();
  });

  it('should not search with empty query', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(searchStories).not.toHaveBeenCalled();
  });

  it('should search with exactly 2 characters', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch('ab'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(searchStories).toHaveBeenCalledWith('ab');
  });

  it('should handle search errors', async () => {
    (searchStories as jest.Mock).mockRejectedValue(new Error('Search failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch('test'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should return empty array when no results', async () => {
    (searchStories as jest.Mock).mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch('nonexistent'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('should search with Arabic query', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch('تقنية'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(searchStories).toHaveBeenCalledWith('تقنية');
  });

  it('should handle special characters in query', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearch('tech & news'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(searchStories).toHaveBeenCalledWith('tech & news');
  });

  it('should update results when query changes', async () => {
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useSearch(query),
      { wrapper, initialProps: { query: 'first' } }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(searchStories).toHaveBeenCalledWith('first');

    // Update query
    (searchStories as jest.Mock).mockResolvedValue([mockSearchResults[0]]);
    rerender({ query: 'second' });

    await waitFor(() => expect(searchStories).toHaveBeenCalledWith('second'));
  });
});
