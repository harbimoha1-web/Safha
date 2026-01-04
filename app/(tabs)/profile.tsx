import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore, useAuthStore } from '@/stores';
import { updateProfile } from '@/lib/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

export default function ProfileScreen() {
  const { settings, setLanguage, setTheme } = useAppStore();
  const { isAuthenticated, profile, user, signOut, setProfile } = useAuthStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const isArabic = settings.language === 'ar';

  const handleEditProfile = () => {
    setEditName(profile?.full_name || '');
    setEditUsername(profile?.username || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updatedProfile = await updateProfile(user.id, {
        full_name: editName.trim() || null,
        username: editUsername.trim() || null,
      });
      setProfile(updatedProfile);
      setEditModalVisible(false);
      Alert.alert(
        isArabic ? 'تم الحفظ' : 'Saved',
        isArabic ? 'تم تحديث ملفك الشخصي' : 'Your profile has been updated'
      );
    } catch (error: any) {
      Alert.alert(
        isArabic ? 'خطأ' : 'Error',
        error.message || (isArabic ? 'فشل في تحديث الملف الشخصي' : 'Failed to update profile')
      );
    } finally {
      setIsSaving(false);
    }
  };

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
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !onPress }}
    >
      <View style={styles.settingsItemLeft}>
        <FontAwesome name={icon as any} size={20} color={colors.primary} />
        <Text style={styles.settingsItemTitle}>{title}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && <Text style={styles.settingsItemValue}>{value}</Text>}
        {showArrow && onPress && (
          <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
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
            <FontAwesome name="user" size={32} color={colors.textPrimary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || profile?.username || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'No email'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'تعديل الملف الشخصي' : 'Edit profile'}
          >
            <FontAwesome name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.signInSection}
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'تسجيل الدخول لمزامنة بياناتك' : 'Sign in to sync your data'}
        >
          <View style={styles.signInContent}>
            <FontAwesome name="sign-in" size={24} color={colors.primary} />
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
          <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
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
            onPress={() => {
              Alert.alert(
                isArabic ? 'قريبًا' : 'Coming Soon',
                isArabic ? 'إعدادات الإشعارات ستتوفر قريبًا' : 'Notification settings will be available soon'
              );
            }}
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
            onPress={() => {
              Alert.alert(
                isArabic ? 'سياسة الخصوصية' : 'Privacy Policy',
                isArabic
                  ? 'نحن نحترم خصوصيتك ونحمي بياناتك الشخصية. سيتم إضافة سياسة الخصوصية الكاملة قريبًا.'
                  : 'We respect your privacy and protect your personal data. Full privacy policy will be available soon.'
              );
            }}
          />
          <SettingsItem
            icon="legal"
            title={isArabic ? 'شروط الاستخدام' : 'Terms of Service'}
            onPress={() => {
              Alert.alert(
                isArabic ? 'شروط الاستخدام' : 'Terms of Service',
                isArabic
                  ? 'باستخدام هذا التطبيق، أنت توافق على شروط الاستخدام الخاصة بنا. ستتوفر الشروط الكاملة قريبًا.'
                  : 'By using this app, you agree to our terms of service. Full terms will be available soon.'
              );
            }}
          />
        </View>
      </View>

      {/* Sign Out */}
      {isAuthenticated && (
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'تسجيل الخروج' : 'Sign out'}
        >
          <FontAwesome name="sign-out" size={20} color={colors.error} />
          <Text style={styles.signOutText}>
            {isArabic ? 'تسجيل الخروج' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer} />

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isArabic ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
              >
                <FontAwesome name="times" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>
                {isArabic ? 'الاسم الكامل' : 'Full Name'}
              </Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder={isArabic ? 'أدخل اسمك' : 'Enter your name'}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={isArabic ? 'الاسم الكامل' : 'Full name'}
              />

              <Text style={styles.inputLabel}>
                {isArabic ? 'اسم المستخدم' : 'Username'}
              </Text>
              <TextInput
                style={styles.input}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder={isArabic ? 'أدخل اسم المستخدم' : 'Enter username'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                accessibilityLabel={isArabic ? 'اسم المستخدم' : 'Username'}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'حفظ التغييرات' : 'Save changes'}
              accessibilityState={{ disabled: isSaving }}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isArabic ? 'حفظ' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  arabicText: {
    textAlign: 'right',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  signInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  signInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  signInText: {},
  signInTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  signInSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xxxl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsItemTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsItemValue: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  modalForm: {
    gap: spacing.lg,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: spacing.lg - 2,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
