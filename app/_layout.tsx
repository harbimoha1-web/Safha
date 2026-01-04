import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

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
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore, useAppStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

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
  const { isOnboarded } = useAppStore();

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

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated, redirect to login
      // For now, allow guest access to feed
    } else if (isAuthenticated && inAuthGroup && !(segments as string[])[1]?.includes('onboarding')) {
      // User is authenticated but in auth group (not onboarding)
      if (!isOnboarded) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)/feed');
      }
    }
  }, [isAuthenticated, segments, isLoading, isOnboarded]);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

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
  const colorScheme = useColorScheme();
  const { settings } = useAppStore();
  const [initError, setInitError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useProtectedRoute(
    (error) => setInitError(error),
    () => setIsReady(true)
  );

  // Use dark theme by default for Teller
  const theme = settings.theme === 'light' ? DefaultTheme : DarkTheme;

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
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
      </ThemeProvider>
    </QueryClientProvider>
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
