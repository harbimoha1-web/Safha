import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/stores';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminLayout() {
  const { isAuthenticated, isAdminOrModerator, isLoading } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    // Redirect non-admins away from admin pages
    if (!isLoading && (!isAuthenticated || !isAdminOrModerator)) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, isAdminOrModerator]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Verifying access...
        </Text>
      </View>
    );
  }

  // Don't render if not admin
  if (!isAuthenticated || !isAdminOrModerator) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Access denied
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Admin Dashboard', headerShown: true }}
      />
      <Stack.Screen
        name="sources"
        options={{ title: 'Manage Sources', headerShown: true }}
      />
      <Stack.Screen
        name="source-topics"
        options={{ title: 'Source-Topic Assignment', headerShown: true }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
