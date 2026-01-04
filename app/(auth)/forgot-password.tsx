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
            <FontAwesome name="check-circle" size={80} color="#4CAF50" />
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
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(undefined);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
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
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backArrow: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
  },
  backArrowRtl: {
    left: undefined,
    right: 24,
  },
  arabicText: {
    textAlign: 'right',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
  },
  form: {
    gap: 16,
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
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
