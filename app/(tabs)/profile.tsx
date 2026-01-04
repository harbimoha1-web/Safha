import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore, useAuthStore } from '@/stores';

export default function ProfileScreen() {
  const { settings, setLanguage, setTheme } = useAppStore();
  const { isAuthenticated, profile, signOut } = useAuthStore();

  const isArabic = settings.language === 'ar';

  const handleSignOut = async () => {
    Alert.alert(
      isArabic ? 'تسجيل الخروج' : 'Sign Out',
      isArabic ? 'هل أنت متأكد؟' : 'Are you sure you want to sign out?',
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'تسجيل الخروج' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const toggleLanguage = () => {
    setLanguage(isArabic ? 'en' : 'ar');
  };

  const SettingsItem = ({
    icon,
    title,
    value,
    onPress,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <FontAwesome name={icon as any} size={20} color="#007AFF" />
        <Text style={styles.settingsItemTitle}>{title}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && <Text style={styles.settingsItemValue}>{value}</Text>}
        {showArrow && onPress && (
          <FontAwesome name="chevron-right" size={14} color="#666" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isArabic && styles.arabicText]}>
          {isArabic ? 'الإعدادات' : 'Settings'}
        </Text>
      </View>

      {/* Profile Section */}
      {isAuthenticated ? (
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={32} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || profile?.username || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {/* Email would come from auth.user */}
              user@example.com
            </Text>
          </View>
          <TouchableOpacity>
            <FontAwesome name="pencil" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.signInSection}
          onPress={() => router.push('/(auth)/login')}
        >
          <View style={styles.signInContent}>
            <FontAwesome name="sign-in" size={24} color="#007AFF" />
            <View style={styles.signInText}>
              <Text style={styles.signInTitle}>
                {isArabic ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
              <Text style={styles.signInSubtitle}>
                {isArabic
                  ? 'سجل لمزامنة بياناتك'
                  : 'Sign in to sync your data'}
              </Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={14} color="#666" />
        </TouchableOpacity>
      )}

      {/* Language & Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isArabic && styles.arabicText]}>
          {isArabic ? 'اللغة والمظهر' : 'Language & Appearance'}
        </Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="language"
            title={isArabic ? 'اللغة' : 'Language'}
            value={isArabic ? 'العربية' : 'English'}
            onPress={toggleLanguage}
          />
          <SettingsItem
            icon="moon-o"
            title={isArabic ? 'المظهر' : 'Theme'}
            value={
              settings.theme === 'dark'
                ? isArabic
                  ? 'داكن'
                  : 'Dark'
                : settings.theme === 'light'
                ? isArabic
                  ? 'فاتح'
                  : 'Light'
                : isArabic
                ? 'تلقائي'
                : 'System'
            }
            onPress={() => {
              const themes: ('light' | 'dark' | 'system')[] = [
                'system',
                'light',
                'dark',
              ];
              const currentIndex = themes.indexOf(settings.theme);
              setTheme(themes[(currentIndex + 1) % themes.length]);
            }}
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isArabic && styles.arabicText]}>
          {isArabic ? 'الإشعارات' : 'Notifications'}
        </Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="bell-o"
            title={isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Topics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isArabic && styles.arabicText]}>
          {isArabic ? 'المواضيع' : 'Topics'}
        </Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="tags"
            title={isArabic ? 'إدارة اهتماماتك' : 'Manage Your Interests'}
            onPress={() => router.push('/(auth)/onboarding')}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isArabic && styles.arabicText]}>
          {isArabic ? 'حول التطبيق' : 'About'}
        </Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="info-circle"
            title={isArabic ? 'الإصدار' : 'Version'}
            value="1.0.0"
            showArrow={false}
          />
          <SettingsItem
            icon="file-text-o"
            title={isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
            onPress={() => {}}
          />
          <SettingsItem
            icon="legal"
            title={isArabic ? 'شروط الاستخدام' : 'Terms of Service'}
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Sign Out */}
      {isAuthenticated && (
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <FontAwesome name="sign-out" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>
            {isArabic ? 'تسجيل الخروج' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  arabicText: {
    textAlign: 'right',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  profileEmail: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  signInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  signInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInText: {},
  signInTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemTitle: {
    color: '#fff',
    fontSize: 16,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsItemValue: {
    color: '#888',
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 100,
  },
});
