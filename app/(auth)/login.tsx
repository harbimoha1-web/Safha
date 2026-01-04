import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  I18nManager,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore, useAppStore } from '@/stores';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

// Enable RTL for Arabic
I18nManager.allowRTL(true);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signInWithEmail, signInWithGoogle, signInWithApple, isLoading } = useAuthStore();
  const { settings } = useAppStore();
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

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    try {
      await signInWithEmail(email, password);
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      setErrors({ password: error.message });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
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
    } catch (error: any) {
      Alert.alert(
        isArabic ? 'فشل تسجيل الدخول بأبل' : 'Apple Login Failed',
        error.message
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo & Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>تيلر</Text>
          <Text style={styles.subtitle}>Teller</Text>
          <Text style={styles.tagline}>
            {isArabic ? 'رفيقك الإخباري المدعوم بالذكاء الاصطناعي' : 'Your AI-Powered News Companion'}
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View>
            <TextInput
              style={[styles.input, isArabic && styles.arabicText, errors.email && styles.inputError]}
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
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View>
            <TextInput
              style={[styles.input, isArabic && styles.arabicText, errors.password && styles.inputError]}
              placeholder={isArabic ? 'كلمة المرور' : 'Password'}
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry
              autoComplete="password"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={[styles.forgotPassword, isArabic && styles.arabicText]}>
              {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.loginButtonText}>
                {isArabic ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>
            {isArabic ? 'أو تابع باستخدام' : 'or continue with'}
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.socialButtonText}>
              {isArabic ? 'جوجل' : 'Google'}
            </Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleAppleLogin}
            >
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                {isArabic ? 'أبل' : 'Apple'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isArabic ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>
                {isArabic ? 'إنشاء حساب' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
  },
  logo: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    opacity: 0.9,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  forgotPassword: {
    color: colors.primary,
    fontSize: fontSize.sm,
    textAlign: 'right',
  },
  arabicText: {
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  appleButton: {
    backgroundColor: colors.textPrimary,
  },
  appleButtonText: {
    color: colors.textInverse,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  footerLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
