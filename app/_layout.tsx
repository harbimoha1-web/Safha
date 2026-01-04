import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
          <FontAwesome name="bug" size={48} color="#FF6B6B" />
          <Text style={boundaryStyles.title}>Something went wrong</Text>
          <Text style={boundaryStyles.titleAr}>حدث خطأ ما</Text>
          <Text style={boundaryStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={boundaryStyles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  titleAr: {
    color: '#888',
    fontSize: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  message: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
        <FontAwesome name="exclamation-triangle" size={48} color="#FF6B6B" />
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
