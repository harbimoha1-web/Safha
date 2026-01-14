import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - news updates frequently
      gcTime: 1000 * 60 * 5, // 5 minutes - shorter cache for fresh content
      retry: 3, // Retry failed queries 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s... max 30s
    },
    mutations: {
      retry: 2, // Retry failed mutations 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s for mutations
    },
  },
});
