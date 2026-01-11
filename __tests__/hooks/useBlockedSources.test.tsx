/**
 * useBlockedSources Hook Tests
 * Tests blocked sources fetching and block/unblock mutations
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useBlockedSources,
  useBlockedSourceIds,
  useBlockSource,
  useUnblockSource
} from '@/hooks/useBlockedSources';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  getBlockedSources: jest.fn(),
  getBlockedSourceIds: jest.fn(),
  blockSource: jest.fn(),
  unblockSource: jest.fn(),
}));

jest.mock('@/stores', () => ({
  useAuthStore: jest.fn(() => ({ user: { id: 'user123' } })),
}));

import { getBlockedSources, getBlockedSourceIds, blockSource, unblockSource } from '@/lib/api';
import { useAuthStore } from '@/stores';

const mockBlockedSources = [
  { id: 'source1', name: 'Blocked Source 1', favicon: null },
  { id: 'source2', name: 'Blocked Source 2', favicon: null },
];

const mockBlockedSourceIds = ['source1', 'source2'];

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

describe('useBlockedSources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBlockedSources as jest.Mock).mockResolvedValue(mockBlockedSources);
    (useAuthStore as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should fetch blocked sources for authenticated user', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockedSources(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getBlockedSources).toHaveBeenCalledWith('user123');
    expect(result.current.data).toEqual(mockBlockedSources);
  });

  it('should not fetch when user is not authenticated', async () => {
    (useAuthStore as jest.Mock).mockReturnValue({ user: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockedSources(), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(getBlockedSources).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    (getBlockedSources as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockedSources(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useBlockedSourceIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBlockedSourceIds as jest.Mock).mockResolvedValue(mockBlockedSourceIds);
    (useAuthStore as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should fetch blocked source IDs for authenticated user', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockedSourceIds(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getBlockedSourceIds).toHaveBeenCalledWith('user123');
    expect(result.current.data).toEqual(mockBlockedSourceIds);
  });

  it('should not fetch when user is not authenticated', async () => {
    (useAuthStore as jest.Mock).mockReturnValue({ user: null });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockedSourceIds(), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(getBlockedSourceIds).not.toHaveBeenCalled();
  });

  it('should return empty array when no sources blocked', async () => {
    (getBlockedSourceIds as jest.Mock).mockResolvedValue([]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockedSourceIds(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('useBlockSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (blockSource as jest.Mock).mockResolvedValue({ success: true });
    (getBlockedSources as jest.Mock).mockResolvedValue(mockBlockedSources);
    (getBlockedSourceIds as jest.Mock).mockResolvedValue(mockBlockedSourceIds);
    (useAuthStore as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should block a source', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockSource(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('newSource');
    });

    expect(blockSource).toHaveBeenCalledWith('user123', 'newSource');
  });

  it('should handle block errors', async () => {
    (blockSource as jest.Mock).mockRejectedValue(new Error('Block failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBlockSource(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync('source1');
      })
    ).rejects.toThrow('Block failed');
  });
});

describe('useUnblockSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (unblockSource as jest.Mock).mockResolvedValue({ success: true });
    (getBlockedSources as jest.Mock).mockResolvedValue(mockBlockedSources);
    (getBlockedSourceIds as jest.Mock).mockResolvedValue(mockBlockedSourceIds);
    (useAuthStore as jest.Mock).mockReturnValue({ user: { id: 'user123' } });
  });

  it('should unblock a source', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnblockSource(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('source1');
    });

    expect(unblockSource).toHaveBeenCalledWith('user123', 'source1');
  });

  it('should handle unblock errors', async () => {
    (unblockSource as jest.Mock).mockRejectedValue(new Error('Unblock failed'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnblockSource(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync('source1');
      })
    ).rejects.toThrow('Unblock failed');
  });
});
