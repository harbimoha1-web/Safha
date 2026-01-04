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
    if (!value) return { level: '', color: '#333', widthPercent: 0 };
    if (value.length < 6) return { level: isArabic ? 'ضعيفة' : 'Weak', color: '#FF6B6B', widthPercent: 25 };
    if (value.length < 8) return { level: isArabic ? 'متوسطة' : 'Fair', color: '#FFB800', widthPercent: 50 };
    if (/[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) {
      return { level: isArabic ? 'قوية جداً' : 'Very Strong', color: '#4CAF50', widthPercent: 100 };
    }
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) {
      return { level: isArabic ? 'قوية' : 'Strong', color: '#8BC34A', widthPercent: 75 };
    }
    return { level: isArabic ? 'جيدة' : 'Good', color: '#8BC34A', widthPercent: 60 };
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
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
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              secureTextEntry
              autoComplete="new-password"
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
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
            <TouchableOpacity>
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
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  form: {
    gap: 16,
  },
  arabicText: {
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  terms: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  link: {
    color: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  footerLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
