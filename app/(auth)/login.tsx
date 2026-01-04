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
              <ActivityIndicator color="#fff" />
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
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.9,
  },
  tagline: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  forgotPassword: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'right',
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
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#fff',
  },
  appleButtonText: {
    color: '#000',
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
