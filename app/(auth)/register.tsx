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
import { Link, router } from 'expo-router';
import { useAuthStore, useAppStore } from '@/stores';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const { signUpWithEmail, isLoading } = useAuthStore();
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
    if (value.length < 6) return isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    return undefined;
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) return isArabic ? 'تأكيد كلمة المرور مطلوب' : 'Confirm password is required';
    if (value !== password) return isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
    return undefined;
  };

  const getPasswordStrength = (value: string): { level: string; color: string; widthPercent: number } => {
    if (!value) return { level: '', color: colors.border, widthPercent: 0 };
    if (value.length < 6) return { level: isArabic ? 'ضعيفة' : 'Weak', color: colors.error, widthPercent: 25 };
    if (value.length < 8) return { level: isArabic ? 'متوسطة' : 'Fair', color: colors.warning, widthPercent: 50 };
    if (/[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) {
      return { level: isArabic ? 'قوية جداً' : 'Very Strong', color: colors.success, widthPercent: 100 };
    }
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) {
      return { level: isArabic ? 'قوية' : 'Strong', color: colors.successLight, widthPercent: 75 };
    }
    return { level: isArabic ? 'جيدة' : 'Good', color: colors.successLight, widthPercent: 60 };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleRegister = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);

    setErrors({ email: emailError, password: passwordError, confirmPassword: confirmPasswordError });

    if (emailError || passwordError || confirmPasswordError) return;

    try {
      await signUpWithEmail(email, password);
      router.replace('/(auth)/onboarding');
    } catch (error: any) {
      setErrors({ email: error.message });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isArabic && styles.arabicText]}>
            {isArabic ? 'إنشاء حساب' : 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, isArabic && styles.arabicText]}>
            {isArabic ? 'انضم إلى تيلر وابقَ على اطلاع' : 'Join Teller and stay informed'}
          </Text>
        </View>

        {/* Register Form */}
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
              accessibilityLabel={isArabic ? 'البريد الإلكتروني' : 'Email address'}
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
              autoComplete="new-password"
              accessibilityLabel={isArabic ? 'كلمة المرور' : 'Password'}
            />
            {password.length > 0 && (
              <View
                style={styles.strengthContainer}
                accessible={true}
                accessibilityLabel={isArabic ? `قوة كلمة المرور: ${passwordStrength.level}` : `Password strength: ${passwordStrength.level}`}
                accessibilityRole="progressbar"
              >
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${passwordStrength.widthPercent}%`, backgroundColor: passwordStrength.color }]} />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.level}</Text>
              </View>
            )}
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View>
            <TextInput
              style={[styles.input, isArabic && styles.arabicText, errors.confirmPassword && styles.inputError]}
              placeholder={isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              secureTextEntry
              autoComplete="new-password"
              accessibilityLabel={isArabic ? 'تأكيد كلمة المرور' : 'Confirm password'}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'إنشاء حساب' : 'Create account'}
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.registerButtonText}>
                {isArabic ? 'إنشاء حساب' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, isArabic && styles.arabicText]}>
          {isArabic ? (
            <>
              بالتسجيل، أنت توافق على{' '}
              <Text style={styles.link}>شروط الاستخدام</Text> و{' '}
              <Text style={styles.link}>سياسة الخصوصية</Text>
            </>
          ) : (
            <>
              By signing up, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </>
          )}
        </Text>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isArabic ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel={isArabic ? 'الذهاب لتسجيل الدخول' : 'Go to sign in'}
            >
              <Text style={styles.footerLink}>
                {isArabic ? 'تسجيل الدخول' : 'Sign In'}
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
    marginBottom: spacing.xxxxl,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
  strengthText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  registerButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  terms: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
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
