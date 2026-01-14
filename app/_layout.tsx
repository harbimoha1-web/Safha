import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { captureException } from '@/lib/errorTracking';

// Global Error Boundary for runtime errors
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught:', error, errorInfo);
    // Report error to tracking service
    captureException(error, {
      componentStack: errorInfo.componentStack,
      source: 'AppErrorBoundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={boundaryStyles.container}>
          <FontAwesome name="bug" size={48} color={colors.error} />
          <Text style={boundaryStyles.title}>Something went wrong</Text>
          <Text style={boundaryStyles.titleAr}>حدث خطأ ما</Text>
          <Text style={boundaryStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={boundaryStyles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={boundaryStyles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const boundaryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.lg,
  },
  titleAr: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg - 2,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
} from '@expo-google-fonts/tajawal';
import { useAuthStore, useAppStore } from '@/stores';
import { useSubscriptionStore } from '@/stores/subscription';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { getTopics, getSources } from '@/lib/api';
import { TOPICS_STALE_TIME } from '@/hooks/useTopics';
import { SOURCES_STALE_TIME } from '@/hooks/useSources';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { initializeErrorTracking, setUser } from '@/lib/errorTracking';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function useProtectedRoute(onError: (error: string) => void, onReady: () => void) {
  const segments = useSegments();
  const { isAuthenticated, isLoading, setSession, fetchProfile } = useAuthStore();
  const { isOnboarded, hasSurveyCompleted } = useAppStore();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let didComplete = false;

    // Set a 10-second timeout for initialization
    timeoutId = setTimeout(() => {
      if (!didComplete) {
        onError('Connection timed out. Please check your internet connection.');
      }
    }, 10000);

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        didComplete = true;
        clearTimeout(timeoutId);
        if (error) {
          console.error('Auth error:', error);
          onError(`Auth error: ${error.message}`);
          return;
        }
        setSession(session);
        if (session) {
          fetchProfile().catch(console.error);
        }
        onReady();
      })
      .catch((err) => {
        didComplete = true;
        clearTimeout(timeoutId);
        console.error('Session error:', err);
        onError(`Failed to connect: ${err.message}`);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile().catch(console.error);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentPath = (segments as string[])[1] || '';

    // First time users - show welcome survey (before any login/onboarding)
    if (!hasSurveyCompleted && !inAuthGroup) {
      router.replace('/(auth)/welcome-survey');
      return;
    }

    // Skip redirect if already on welcome-survey or onboarding
    if (currentPath === 'welcome-survey' || currentPath === 'onboarding') {
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated, allow guest access to feed
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but in auth group
      if (!isOnboarded) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)/feed');
      }
    }
  }, [isAuthenticated, segments, isLoading, isOnboarded, hasSurveyCompleted]);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Tajawal-Regular': Tajawal_400Regular,
    'Tajawal-Medium': Tajawal_500Medium,
    'Tajawal-Bold': Tajawal_700Bold,
    ...FontAwesome.font,
  });

  // Initialize error tracking on app start
  useEffect(() => {
    initializeErrorTracking();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <RootLayoutNav />
    </AppErrorBoundary>
  );
}

function RootLayoutNav() {
  const { settings } = useAppStore();
  const { user } = useAuthStore();
  const { getValidIntent, isPremium } = useSubscriptionStore();
  const [initError, setInitError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasCheckedIntent, setHasCheckedIntent] = useState(false);

  useProtectedRoute(
    (error) => setInitError(error),
    () => setIsReady(true)
  );

  // UUID validation regex
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // One-time cleanup: Clear invalid cached topics (non-UUID IDs from legacy mock data)
  useEffect(() => {
    if (!isReady) return;

    const { selectedTopics, setSelectedTopics, setOnboarded } = useAppStore.getState();

    // Check if any selected topic has an invalid (non-UUID) ID
    const hasInvalidTopics = selectedTopics.some((t) => !UUID_REGEX.test(t.id));

    if (hasInvalidTopics) {
      console.warn('[Safha] Clearing invalid cached topics (legacy mock data detected)');
      setSelectedTopics([]); // Clear invalid topics
      setOnboarded(false); // Force re-onboarding with real topics
    }
  }, [isReady]);

  // Prefetch topics and sources when app is ready (improves perceived performance)
  useEffect(() => {
    if (!isReady) return;

    // Prefetch in background - doesn't block UI
    queryClient.prefetchQuery({
      queryKey: ['topics'],
      queryFn: getTopics,
      staleTime: TOPICS_STALE_TIME,
    });
    queryClient.prefetchQuery({
      queryKey: ['sources'],
      queryFn: getSources,
      staleTime: SOURCES_STALE_TIME,
    });
  }, [isReady]);

  // Handle pending subscription intent after user logs in
  useEffect(() => {
    if (!user || !isReady || hasCheckedIntent) return;

    const intent = getValidIntent();
    if (intent && !isPremium) {
      setHasCheckedIntent(true);
      // Navigate to subscription screen to complete the flow
      router.push('/subscription');
    } else {
      setHasCheckedIntent(true);
    }
  }, [user, isReady, isPremium, hasCheckedIntent]);

  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={errorStyles.container}>
        <StatusBar style="light" />
        <FontAwesome name="exclamation-triangle" size={48} color={colors.error} />
        <Text style={errorStyles.title}>Connection Error</Text>
        <Text style={errorStyles.message}>{initError}</Text>
        <TouchableOpacity
          style={errorStyles.retryButton}
          onPress={() => {
            setInitError(null);
            setIsReady(false);
            // Force re-render by reloading
            router.replace('/');
          }}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          <Text style={errorStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Inner component that can use useTheme
function ThemedApp() {
  const { isDark, colors: themeColors } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navTheme}>
      <ToastProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="story/[id]"
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ToastProvider>
    </NavigationThemeProvider>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg - 2,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
