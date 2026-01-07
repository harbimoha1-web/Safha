import { useState, useEffect } from 'react';
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
  Linking,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore, useAuthStore, useSubscriptionStore, useGamificationStore } from '@/stores';
import { updateProfile } from '@/lib/api';
import { useBlockedSources, useUnblockSource } from '@/hooks';
import { colors as staticColors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
  const { settings, setLanguage, setTheme } = useAppStore();
  const { isAuthenticated, profile, user, signOut, setProfile } = useAuthStore();
  const { subscription, isPremium, fetchSubscription } = useSubscriptionStore();
  const { stats, unlockedAchievements, fetchStats, fetchAchievements } = useGamificationStore();
  const { colors } = useTheme();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [hiddenSourcesModalVisible, setHiddenSourcesModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  // Blocked sources
  const { data: blockedSources } = useBlockedSources();
  const unblockSourceMutation = useUnblockSource();

  // Notification settings state
  const [notifSettings, setNotifSettings] = useState({
    dailyDigest: false,
    weeklyDigest: true,
    breakingNews: true,
    streakReminder: true,
  });

  const isArabic = settings.language === 'ar';

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
      fetchStats();
      fetchAchievements();
    }
  }, [isAuthenticated]);

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

  const handleUnblockSource = (sourceId: string, sourceName: string) => {
    Alert.alert(
      isArabic ? 'إظهار المصدر' : 'Unhide Source',
      isArabic
        ? `هل تريد إظهار منشورات ${sourceName}؟`
        : `Show posts from ${sourceName} again?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'إظهار' : 'Unhide',
          onPress: () => {
            unblockSourceMutation.mutate(sourceId, {
              onSuccess: () => {
                Alert.alert(
                  isArabic ? 'تم' : 'Done',
                  isArabic
                    ? `تم إظهار منشورات ${sourceName}`
                    : `Now showing posts from ${sourceName}`
                );
              },
            });
          },
        },
      ]
    );
  };

  const handleContactSupport = async () => {
    const email = 'support@safha.app';
    const subject = encodeURIComponent(
      isArabic ? 'طلب دعم من صفحة' : 'Safha Support Request'
    );
    const body = encodeURIComponent(
      isArabic
        ? `مرحباً فريق صفحة،\n\nأحتاج مساعدة بخصوص:\n\n\n---\nمعرف المستخدم: ${user?.id || 'غير مسجل'}\nالإصدار: 1.0.0\nالجهاز: ${Platform.OS}`
        : `Hi Safha Team,\n\nI need help with:\n\n\n---\nUser ID: ${user?.id || 'Not signed in'}\nVersion: 1.0.0\nDevice: ${Platform.OS}`
    );

    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          isArabic ? 'خطأ' : 'Error',
          isArabic
            ? 'لا يمكن فتح تطبيق البريد. يرجى مراسلتنا على support@safha.app'
            : 'Cannot open email app. Please email us at support@safha.app'
        );
      }
    } catch (error) {
      Alert.alert(
        isArabic ? 'خطأ' : 'Error',
        isArabic ? 'فشل في فتح البريد' : 'Failed to open email'
      );
    }
  };

  const SettingsItem = ({
    icon,
    title,
    value,
    onPress,
    showArrow = true,
    rightElement,
    isPremiumFeature = false,
    iconColor,
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
    isPremiumFeature?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !onPress }}
    >
      <View style={styles.settingsItemLeft}>
        <FontAwesome name={icon as any} size={20} color={iconColor || colors.primary} />
        <Text style={[styles.settingsItemTitle, { color: colors.textPrimary }]}>{title}</Text>
        {isPremiumFeature && !isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        )}
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
        {value && <Text style={[styles.settingsItemValue, { color: colors.textSecondary }]}>{value}</Text>}
        {showArrow && onPress && !rightElement && (
          <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {isArabic ? 'حسابي' : 'My Account'}
        </Text>
      </View>

      {/* Profile Section */}
      {isAuthenticated ? (
        <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceLight }]}>
            <FontAwesome name="user" size={32} color={colors.textPrimary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {profile?.full_name || profile?.username || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email || user?.phone || 'No email'}
            </Text>
            {stats && stats.currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {stats.currentStreak}</Text>
              </View>
            )}
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
          style={[styles.signInSection, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'تسجيل الدخول لمزامنة بياناتك' : 'Sign in to sync your data'}
        >
          <View style={styles.signInContent}>
            <FontAwesome name="sign-in" size={24} color={colors.primary} />
            <View style={styles.signInText}>
              <Text style={[styles.signInTitle, { color: colors.textPrimary }]}>
                {isArabic ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
              <Text style={[styles.signInSubtitle, { color: colors.textSecondary }]}>
                {isArabic
                  ? 'سجل لمزامنة بياناتك'
                  : 'Sign in to sync your data'}
              </Text>
            </View>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Premium Section */}
      <TouchableOpacity
        style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }, isPremium && styles.premiumCardActive]}
        onPress={() => router.push('/subscription')}
        accessibilityRole="button"
        accessibilityLabel={isPremium ? (isArabic ? 'أنت مشترك بريميوم' : 'You are Premium') : (isArabic ? 'ترقية إلى بريميوم' : 'Upgrade to Premium')}
      >
        <View style={styles.premiumLeft}>
          <FontAwesome name="star" size={24} color={isPremium ? '#FFD700' : colors.primary} />
          <View style={styles.premiumText}>
            <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>
              {isPremium
                ? (isArabic ? 'مشترك بريميوم' : 'Premium Member')
                : (isArabic ? 'ترقية إلى بريميوم' : 'Upgrade to Premium')}
            </Text>
            <Text style={[styles.premiumSubtitle, { color: colors.textSecondary }]}>
              {isPremium
                ? (isArabic ? 'تستمتع بجميع المميزات' : 'Enjoying all features')
                : (isArabic ? 'ملخصات يومية • بدون إعلانات • المزيد' : 'Daily digests • No ads • More')}
            </Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {/* My Stats Section */}
      {isAuthenticated && (
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
              {isArabic ? 'إحصائياتي' : 'My Stats'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/achievements')}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'عرض الكل' : 'View all'}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                {isArabic ? 'عرض الكل' : 'View All'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsCards}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <FontAwesome name="fire" size={20} color="#FF6B35" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.currentStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isArabic ? 'سلسلة' : 'Streak'}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <FontAwesome name="book" size={20} color="#4CAF50" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.totalStoriesRead || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isArabic ? 'مقروءة' : 'Read'}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <FontAwesome name="trophy" size={20} color="#FFD700" />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{unlockedAchievements?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isArabic ? 'إنجازات' : 'Badges'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Language & Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic ? 'اللغة والمظهر' : 'Language & Appearance'}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic ? 'الإشعارات' : 'Notifications'}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <SettingsItem
            icon="bell-o"
            title={isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
            onPress={() => setNotificationModalVisible(true)}
          />
          <SettingsItem
            icon="magic"
            title={isArabic ? 'أنشئ ملخصي اليومي' : 'Generate My Summary'}
            isPremiumFeature={!isPremium}
            onPress={() => {
              if (!isPremium) {
                router.push('/subscription');
              } else {
                router.push('/summary');
              }
            }}
          />
          <SettingsItem
            icon="whatsapp"
            title={isArabic ? 'ملخص أسبوعي واتساب' : 'Weekly WhatsApp Digest'}
            isPremiumFeature={true}
            iconColor={colors.whatsapp}
            rightElement={
              <Switch
                value={isPremium && notifSettings.weeklyDigest}
                onValueChange={(val) => {
                  if (!isPremium) {
                    router.push('/subscription');
                  } else {
                    setNotifSettings({ ...notifSettings, weeklyDigest: val });
                  }
                }}
                trackColor={{ false: colors.border, true: colors.whatsapp }}
                thumbColor={colors.textPrimary}
              />
            }
            showArrow={false}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic ? 'المحتوى' : 'Content'}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <SettingsItem
            icon="tags"
            title={isArabic ? 'إدارة اهتماماتك' : 'Manage Your Interests'}
            onPress={() => router.push('/(auth)/onboarding')}
          />
          <SettingsItem
            icon="eye-slash"
            title={isArabic ? 'المصادر المخفية' : 'Hidden Sources'}
            value={blockedSources?.length ? `${blockedSources.length}` : undefined}
            onPress={() => setHiddenSourcesModalVisible(true)}
          />
          <SettingsItem
            icon="history"
            title={isArabic ? 'سجل القراءة' : 'Reading History'}
            onPress={() => router.push('/(tabs)/library')}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic ? 'حول التطبيق' : 'About'}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
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
          <SettingsItem
            icon="envelope-o"
            title={isArabic ? 'تواصل مع الدعم' : 'Contact Support'}
            onPress={handleContactSupport}
          />
        </View>
      </View>

      {/* Sign Out */}
      {isAuthenticated && (
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.surface }]}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'تسجيل الخروج' : 'Sign out'}
        >
          <FontAwesome name="sign-out" size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {isArabic ? 'الاسم الكامل' : 'Full Name'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder={isArabic ? 'أدخل اسمك' : 'Enter your name'}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={isArabic ? 'الاسم الكامل' : 'Full name'}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {isArabic ? 'اسم المستخدم' : 'Username'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder={isArabic ? 'أدخل اسم المستخدم' : 'Enter username'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                accessibilityLabel={isArabic ? 'اسم المستخدم' : 'Username'}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'حفظ التغييرات' : 'Save changes'}
              accessibilityState={{ disabled: isSaving }}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isArabic ? 'حفظ' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        visible={notificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
              </Text>
              <TouchableOpacity
                onPress={() => setNotificationModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
              >
                <FontAwesome name="times" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.notifList}>
              <View style={[styles.notifItem, { backgroundColor: colors.background }]}>
                <View>
                  <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>
                    {isArabic ? 'ملخص يومي' : 'Daily Digest'}
                  </Text>
                  <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
                    {isArabic ? 'أهم ما يهمك كل صباح' : 'Top picks for you every morning'}
                  </Text>
                </View>
                <View style={styles.notifRight}>
                  {!isPremium && (
                    <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.premiumBadgeText}>PRO</Text>
                    </View>
                  )}
                  <Switch
                    value={isPremium && notifSettings.dailyDigest}
                    onValueChange={(val) => {
                      if (!isPremium) {
                        router.push('/subscription');
                        setNotificationModalVisible(false);
                      } else {
                        setNotifSettings({ ...notifSettings, dailyDigest: val });
                      }
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={[styles.notifItem, { backgroundColor: colors.background }]}>
                <View>
                  <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>
                    {isArabic ? 'أخبار عاجلة' : 'Breaking News'}
                  </Text>
                  <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
                    {isArabic ? 'تنبيهات فورية للأحداث المهمة' : 'Instant alerts for important updates'}
                  </Text>
                </View>
                <Switch
                  value={notifSettings.breakingNews}
                  onValueChange={(val) => setNotifSettings({ ...notifSettings, breakingNews: val })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.notifItem, { backgroundColor: colors.background }]}>
                <View>
                  <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>
                    {isArabic ? 'تذكير السلسلة' : 'Streak Reminder'}
                  </Text>
                  <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
                    {isArabic ? 'تذكير للحفاظ على سلسلتك' : 'Reminder to keep your streak'}
                  </Text>
                </View>
                <Switch
                  value={notifSettings.streakReminder}
                  onValueChange={(val) => setNotifSettings({ ...notifSettings, streakReminder: val })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.saveButtonText}>
                {isArabic ? 'تم' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hidden Sources Modal */}
      <Modal
        visible={hiddenSourcesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHiddenSourcesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {isArabic ? 'المصادر المخفية' : 'Hidden Sources'}
              </Text>
              <TouchableOpacity
                onPress={() => setHiddenSourcesModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
              >
                <FontAwesome name="times" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {blockedSources && blockedSources.length > 0 ? (
              <ScrollView style={styles.hiddenSourcesList}>
                {blockedSources.map((blocked) => (
                  <View
                    key={blocked.id}
                    style={[styles.hiddenSourceItem, { backgroundColor: colors.background }]}
                  >
                    <View style={styles.hiddenSourceInfo}>
                      <FontAwesome name="newspaper-o" size={20} color={colors.textSecondary} />
                      <Text style={[styles.hiddenSourceName, { color: colors.textPrimary }]}>
                        {blocked.source?.name || (isArabic ? 'مصدر غير معروف' : 'Unknown source')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblockSource(blocked.source_id, blocked.source?.name || '')}
                      accessibilityRole="button"
                      accessibilityLabel={isArabic ? 'إظهار' : 'Unhide'}
                    >
                      <Text style={[styles.unhideText, { color: colors.primary }]}>
                        {isArabic ? 'إظهار' : 'Unhide'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyHiddenSources}>
                <FontAwesome name="check-circle" size={48} color={colors.success} />
                <Text style={[styles.emptyHiddenText, { color: colors.textSecondary }]}>
                  {isArabic ? 'لا توجد مصادر مخفية' : 'No hidden sources'}
                </Text>
                <Text style={[styles.emptyHiddenSubtext, { color: colors.textMuted }]}>
                  {isArabic
                    ? 'يمكنك إخفاء المصادر من القائمة في صفحة الأخبار'
                    : 'You can hide sources from the menu on story cards'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => setHiddenSourcesModalVisible(false)}
            >
              <Text style={styles.saveButtonText}>
                {isArabic ? 'تم' : 'Done'}
              </Text>
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
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  arabicText: {
    textAlign: 'right',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  streakText: {
    color: '#FF6B35',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  signInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  signInSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
  },
  premiumCardActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  premiumText: {},
  premiumTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  premiumSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  premiumBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginLeft: spacing.xs,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  section: {
    marginTop: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsItemTitle: {
    fontSize: fontSize.md,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsItemValue: {
    fontSize: fontSize.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxxl,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  signOutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  modalForm: {
    gap: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: 10,
    padding: spacing.lg - 2,
    fontSize: fontSize.md,
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: 10,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  notifList: {
    gap: spacing.md,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  notifTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  notifDesc: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  notifRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statsSection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statsCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  hiddenSourcesList: {
    maxHeight: 300,
  },
  hiddenSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  hiddenSourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  hiddenSourceName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  unhideText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  emptyHiddenSources: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyHiddenText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginTop: spacing.lg,
  },
  emptyHiddenSubtext: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
