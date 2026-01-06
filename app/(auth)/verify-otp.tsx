import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useAuthStore, useAppStore } from '@/stores';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

export default function VerifyOTPScreen() {
  const { phone, returnTo } = useLocalSearchParams<{ phone: string; returnTo?: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const { verifyOTP, signInWithPhone, pendingPhone, isLoading } = useAuthStore();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  const phoneNumber = phone || pendingPhone || '';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    let newOtp = [...otp];

    if (value.length > 1) {
      // Handle paste
      const otpArray = value.slice(0, 6).split('');
      otpArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const lastFilledIndex = Math.min(index + otpArray.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    setError('');

    // Auto-submit when all 6 digits are entered
    const otpCode = newOtp.join('');
    if (otpCode.length === 6 && !newOtp.includes('')) {
      // Small delay to let the UI update
      setTimeout(() => {
        handleVerifyAuto(otpCode);
      }, 100);
    }
  };

  const handleVerifyAuto = async (otpCode: string) => {
    if (isLoading) return;

    try {
      await verifyOTP(phoneNumber, otpCode);
      router.replace((returnTo || '/(tabs)/feed') as Href);
    } catch (error: any) {
      setError(error.message || (isArabic ? 'رمز التحقق غير صحيح' : 'Invalid verification code'));
      // Clear OTP on error so user can retry
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError(isArabic ? 'أدخل رمز التحقق المكون من 6 أرقام' : 'Enter the 6-digit code');
      return;
    }

    try {
      await verifyOTP(phoneNumber, otpCode);
      router.replace((returnTo || '/(tabs)/feed') as Href);
    } catch (error: any) {
      setError(error.message || (isArabic ? 'رمز التحقق غير صحيح' : 'Invalid verification code'));
    }
  };

  const handleResend = async () => {
    try {
      await signInWithPhone(phoneNumber);
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, isArabic && styles.arabicText]}>
            {isArabic ? 'تحقق من رقمك' : 'Verify Your Number'}
          </Text>
          <Text style={[styles.subtitle, isArabic && styles.arabicText]}>
            {isArabic
              ? `أرسلنا رمز تحقق إلى ${phoneNumber}`
              : `We sent a verification code to ${phoneNumber}`}
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, error && styles.otpInputError]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              accessibilityLabel={`${isArabic ? 'رقم' : 'Digit'} ${index + 1}`}
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'تحقق' : 'Verify'}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.verifyButtonText}>
              {isArabic ? 'تحقق' : 'Verify'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {isArabic ? 'لم يصلك الرمز؟ ' : "Didn't receive the code? "}
          </Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>
              {isArabic ? `إعادة الإرسال خلال ${resendTimer}ث` : `Resend in ${resendTimer}s`}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={styles.resendLink}>
                {isArabic ? 'إعادة الإرسال' : 'Resend'}
              </Text>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  backButtonText: {
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  arabicText: {
    textAlign: 'right',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  verifyButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  resendTimer: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  resendLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
