import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TouchableOpacity,
  Text,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { cn } from '../../lib/cn';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChangeText = (text: string, index: number) => {
    // If user pasted multi-digit code
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const newDigits = cleaned.slice(0, length);
      onChange(newDigits);
      const nextIndex = Math.min(newDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    const combined = newDigits.join('');
    onChange(combined);

    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const numbers = text.replace(/\D/g, '').slice(0, length);
      if (numbers.length > 0) {
        onChange(numbers);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch {
          // safe
        }
        const focusIdx = Math.min(numbers.length, length - 1);
        inputRefs.current[focusIdx]?.focus();
      }
    } catch {
      // safe
    }
  };

  return (
    <View className="w-full items-center my-3">
      <View className="flex-row justify-center space-x-2">
        {digits.map((digit, index) => {
          const isFocused = value.length === index;
          return (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!disabled}
              selectTextOnFocus
              className={cn(
                'w-12 h-14 text-center text-2xl font-bold rounded-xl border bg-surface-light dark:bg-surface-dark text-content-light dark:text-content-dark',
                error
                  ? 'border-danger'
                  : isFocused
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border-light dark:border-border-dark',
                disabled && 'opacity-50'
              )}
            />
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handlePasteClipboard}
        className="mt-3 px-3 py-1.5 rounded-lg bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark"
      >
        <Text className="text-xs font-semibold text-primary dark:text-primary-light">
          Paste OTP from clipboard
        </Text>
      </TouchableOpacity>
    </View>
  );
};
