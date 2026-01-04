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
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore, useAppStore } from '@/stores';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { resetPassword, isLoading } = useAuthStore();
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

  const handleReset = async () => {
    const emailError = validateEmail(email);
    setError(emailError);

    if (emailError) return;

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <FontAwesome name="check-circle" size={80} color={colors.success} />
            <Text style={[styles.successTitle, isArabic && styles.arabicText]}>
              {isArabic ? 'تحقق من بريدك' : 'Check Your Email'}
            </Text>
            <Text style={[styles.successMessage, isArabic && styles.arabicText]}>
              {isArabic
                ? `لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى ${email}. يرجى التحقق من صندوق الوارد واتباع التعليمات.`
                : `We've sent a password reset link to ${email}. Please check your inbox and follow the instructions.`}
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'العودة لتسجيل الدخول' : 'Return to login'}
            >
              <Text style={styles.backButtonText}>
                {isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <TouchableOpacity
          style={[styles.backArrow, isArabic && styles.backArrowRtl]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
        >
          <FontAwesome name={isArabic ? 'arrow-right' : 'arrow-left'} size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, isArabic && styles.arabicText]}>
            {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </Text>
          <Text style={[styles.subtitle, isArabic && styles.arabicText]}>
            {isArabic
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.'
              : "Enter your email address and we'll send you a link to reset your password."}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View>
            <TextInput
              style={[styles.input, isArabic && styles.arabicText, error && styles.inputError]}
              placeholder={isArabic ? 'البريد الإلكتروني' : 'Email'}
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(undefined);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel={isArabic ? 'البريد الإلكتروني' : 'Email address'}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إرسال رابط إعادة التعيين' : 'Send reset link'}
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.resetButtonText}>
                {isArabic ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'العودة لتسجيل الدخول' : 'Back to login'}
        >
          <Text style={styles.loginLinkText}>
            {isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </Text>
        </TouchableOpacity>
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
  backArrow: {
    position: 'absolute',
    top: 60,
    left: spacing.xxl,
    zIndex: 1,
  },
  backArrowRtl: {
    left: undefined,
    right: spacing.xxl,
  },
  arabicText: {
    textAlign: 'right',
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    gap: spacing.lg,
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
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resetButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  loginLinkText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  successTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  successMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
