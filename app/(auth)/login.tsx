import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  I18nManager,
} from 'react-native';
import { Link, router, useLocalSearchParams, Href } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useAppStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { colors as defaultColors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

// Enable RTL for Arabic
I18nManager.allowRTL(true);

type AuthTab = 'email' | 'phone';

export default function LoginScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string }>({});
  const { signInWithEmail, signInWithPhone, signInWithGoogle, signInWithApple, isLoading } = useAuthStore();
  const { settings } = useAppStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';

  const validateEmail = (value: string): string | undefined => {
    if (!value) return isArabic ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return isArabic ? 'بريد إلكتروني غير صالح' : 'Invalid email format';
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return isArabic ? 'كلمة المرور مطلوبة' : 'Password is required';
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value) return isArabic ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    // Saudi phone validation
    const phoneClean = value.replace(/\s+/g, '');
    if (!/^(05|5|\+9665|9665)\d{8}$/.test(phoneClean)) {
      return isArabic ? 'رقم هاتف سعودي غير صالح' : 'Invalid Saudi phone number';
    }
    return undefined;
  };

  const handleEmailLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    try {
      await signInWithEmail(email, password);
      router.replace((returnTo || '/(tabs)/feed') as Href);
    } catch (error: any) {
      setErrors({ password: error.message });
    }
  };

  const handlePhoneLogin = async () => {
    const phoneError = validatePhone(phone);
    setErrors({ phone: phoneError });

    if (phoneError) return;

    try {
      await signInWithPhone(phone);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone, returnTo: returnTo || '' }
      });
    } catch (error: any) {
      setErrors({ phone: error.message });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      router.replace((returnTo || '/(tabs)/feed') as Href);
    } catch (error: any) {
      Alert.alert(
        isArabic ? 'فشل تسجيل الدخول بجوجل' : 'Google Login Failed',
        error.message
      );
    }
  };

  const handleAppleLogin = async () => {
    try {
      await signInWithApple();
      router.replace((returnTo || '/(tabs)/feed') as Href);
    } catch (error: any) {
      Alert.alert(
        isArabic ? 'فشل تسجيل الدخول بأبل' : 'Apple Login Failed',
        error.message
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceOverlay, borderRadius: 20 }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
          >
            <FontAwesome name="times" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Logo & Title */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.textPrimary }]}>صفحة</Text>
          <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Safha</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            {isArabic ? 'كل اهتماماتك. من مصادر موثوقة.' : 'All your interests. From trusted sources.'}
          </Text>
        </View>

        {/* Auth Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'email' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('email')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'email' }}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'email' && { color: colors.textPrimary }]}>
              {isArabic ? 'البريد' : 'Email'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'phone' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('phone')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'phone' }}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'phone' && { color: colors.textPrimary }]}>
              {isArabic ? 'الهاتف' : 'Phone'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {activeTab === 'email' ? (
            <>
              <View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }, isArabic && styles.arabicText, errors.email && { borderColor: colors.error }]}
                  placeholder={isArabic ? 'البريد الإلكتروني' : 'Email'}
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  accessibilityLabel={isArabic ? 'البريد الإلكتروني' : 'Email address'}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View>
                <View style={[styles.passwordContainer, { backgroundColor: colors.surface, borderColor: colors.border }, errors.password && { borderColor: colors.error }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.textPrimary }, isArabic && styles.arabicText]}
                    placeholder={isArabic ? 'كلمة المرور' : 'Password'}
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    accessibilityLabel={isArabic ? 'كلمة المرور' : 'Password'}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? (isArabic ? 'إخفاء كلمة المرور' : 'Hide password') : (isArabic ? 'إظهار كلمة المرور' : 'Show password')}
                  >
                    <FontAwesome
                      name={showPassword ? 'eye-slash' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'نسيت كلمة المرور' : 'Forgot password'}
              >
                <Text style={[styles.forgotPassword, { color: colors.primary }, isArabic && styles.arabicText]}>
                  {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: colors.primary }]}
                onPress={handleEmailLogin}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'تسجيل الدخول' : 'Sign in'}
                accessibilityState={{ disabled: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.loginButtonText}>
                    {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View>
                <View style={styles.phoneInputContainer}>
                  <View style={[styles.countryCode, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.countryCodeText, { color: colors.textPrimary }]}>🇸🇦 +966</Text>
                  </View>
                  <TextInput
                    style={[styles.phoneInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }, errors.phone && { borderColor: colors.error }]}
                    placeholder={isArabic ? '5XXXXXXXX' : '5XXXXXXXX'}
                    placeholderTextColor={colors.placeholder}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    accessibilityLabel={isArabic ? 'رقم الهاتف' : 'Phone number'}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: colors.primary }]}
                onPress={handlePhoneLogin}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'إرسال رمز التحقق' : 'Send verification code'}
                accessibilityState={{ disabled: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.loginButtonText}>
                    {isArabic ? 'إرسال رمز التحقق' : 'Send OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>
            {isArabic ? 'أو تابع باستخدام' : 'or continue with'}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Social Login */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={[styles.socialButton, { borderColor: colors.border }]}
            onPress={handleGoogleLogin}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'تسجيل الدخول بجوجل' : 'Sign in with Google'}
          >
            <Text style={[styles.socialButtonText, { color: colors.textPrimary }]}>
              {isArabic ? 'جوجل' : 'Google'}
            </Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleAppleLogin}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'تسجيل الدخول بأبل' : 'Sign in with Apple'}
            >
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                {isArabic ? 'أبل' : 'Apple'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {isArabic ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel={isArabic ? 'إنشاء حساب جديد' : 'Create a new account'}
            >
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {isArabic ? 'إنشاء حساب' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: defaultColors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.xxl,
    color: defaultColors.textPrimary,
    opacity: 0.9,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: defaultColors.textSecondary,
    marginTop: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: defaultColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: defaultColors.primary,
  },
  tabText: {
    color: defaultColors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: defaultColors.textPrimary,
  },
  form: {
    gap: spacing.lg,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryCode: {
    backgroundColor: defaultColors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  countryCodeText: {
    color: defaultColors.textPrimary,
    fontSize: fontSize.md,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: defaultColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: defaultColors.textPrimary,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  forgotPassword: {
    color: defaultColors.primary,
    fontSize: fontSize.sm,
    textAlign: 'right',
  },
  arabicText: {
    textAlign: 'right',
  },
  input: {
    backgroundColor: defaultColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: defaultColors.textPrimary,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: defaultColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: defaultColors.textPrimary,
  },
  passwordToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  passwordToggleText: {
    fontSize: fontSize.lg,
  },
  inputError: {
    borderColor: defaultColors.error,
  },
  errorText: {
    color: defaultColors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  loginButton: {
    backgroundColor: defaultColors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginButtonText: {
    color: defaultColors.buttonPrimaryText,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: defaultColors.border,
  },
  dividerText: {
    color: defaultColors.textSecondary,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    backgroundColor: defaultColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  socialButtonText: {
    color: defaultColors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  appleButton: {
    backgroundColor: defaultColors.textPrimary,
  },
  appleButtonText: {
    color: defaultColors.textInverse,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: {
    color: defaultColors.textSecondary,
    fontSize: fontSize.sm,
  },
  footerLink: {
    color: defaultColors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
