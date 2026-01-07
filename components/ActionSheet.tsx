import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { HapticFeedback } from '@/lib/haptics';
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants';

export interface ActionSheetOption {
  label: string;
  labelAr: string;
  icon: string;
  iconColor?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  titleAr?: string;
  options: ActionSheetOption[];
}

export function ActionSheet({ visible, onClose, title, titleAr, options }: ActionSheetProps) {
  const { colors } = useTheme();
  const { settings } = useAppStore();
  const insets = useSafeAreaInsets();
  const isArabic = settings.language === 'ar';

  const handleOptionPress = (option: ActionSheetOption) => {
    HapticFeedback.buttonPress();
    onClose();
    // Small delay to let modal close animation start
    setTimeout(() => option.onPress(), 150);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[
              styles.container,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + spacing.lg,
              }
            ]}>
              {/* Handle bar */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Title */}
              {(title || titleAr) && (
                <Text style={[
                  styles.title,
                  { color: colors.textSecondary },
                  isArabic && styles.arabicText
                ]}>
                  {isArabic ? titleAr : title}
                </Text>
              )}

              {/* Options */}
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    index === options.length - 1 && styles.lastOption,
                    isArabic && styles.optionRtl,
                  ]}
                  onPress={() => handleOptionPress(option)}
                  accessibilityRole="button"
                  accessibilityLabel={isArabic ? option.labelAr : option.label}
                >
                  <FontAwesome
                    name={option.icon as any}
                    size={20}
                    color={option.destructive ? colors.error : (option.iconColor || colors.primary)}
                  />
                  <Text style={[
                    styles.optionText,
                    { color: option.destructive ? colors.error : colors.textPrimary },
                    isArabic && styles.arabicText,
                  ]}>
                    {isArabic ? option.labelAr : option.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Cancel button */}
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'إلغاء' : 'Cancel'}
              >
                <Text style={[styles.cancelText, { color: colors.primary }]}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  optionRtl: {
    flexDirection: 'row-reverse',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cancelButton: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
