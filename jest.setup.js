// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Sentry React Native (native module)
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({ setExtra: jest.fn(), setTag: jest.fn() })),
  Severity: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
    Debug: 'debug',
  },
  wrap: (component) => component,
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        order: jest.fn(() => ({
          range: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
        textSearch: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    })),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: 'Link',
}));

// Silence React Native warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
