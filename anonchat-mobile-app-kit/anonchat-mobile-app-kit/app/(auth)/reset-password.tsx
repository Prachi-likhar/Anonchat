import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { resetPasswordSchema, ResetPasswordFormData } from '../../src/lib/validators';
import { evaluatePasswordStrength } from '../../src/lib/passwordStrength';
import { api } from '../../src/api/client';
import { formatErrorMessage } from '../../src/lib/errors';
import { Button, TextField, OtpInput, Card } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';
import { toast } from '../../src/store/toastStore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = params.email ? decodeURIComponent(params.email) : '';

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const otpValue = watch('otp');
  const passwordValue = watch('newPassword');
  const strength = evaluatePasswordStrength(passwordValue || '');

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    setServerError(null);
    try {
      await api.post('/auth/reset-password', {
        email: data.email.trim().toLowerCase(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      });

      toast.success('Password reset successfully. Please log in.');
      router.replace('/(auth)/login');
    } catch (err) {
      setServerError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background-light dark:bg-background-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-2-light dark:bg-surface-2-dark mb-4"
        >
          <ArrowLeft size={20} color={tokens.colors.content.dark} />
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-content-light dark:text-content-dark mb-1">
          Create New Password
        </Text>
        <Text className="text-sm text-muted-light dark:text-muted-dark mb-6">
          Enter the 6-digit code sent to your email along with your new password.
        </Text>

        {serverError && (
          <Card className="bg-red-500/10 border-red-500/30 p-3.5 mb-4 flex-row items-center">
            <ShieldAlert size={18} color={tokens.colors.danger} />
            <Text className="text-sm text-danger font-medium ml-2.5 flex-1">
              {serverError}
            </Text>
          </Card>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium mb-1.5 text-content-light dark:text-content-dark">
            6-Digit Recovery Code
          </Text>
          <OtpInput
            value={otpValue}
            onChange={(val) => setValue('otp', val)}
            error={Boolean(errors.otp?.message)}
            disabled={loading}
          />
          {errors.otp?.message && (
            <Text className="text-xs text-danger text-center mt-1">
              {errors.otp.message}
            </Text>
          )}
        </View>

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <TextField
                label="New Password"
                placeholder="At least 8 chars (1 letter + 1 number)"
                secureTextEntry
                showPasswordToggle
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.newPassword?.message}
              />

              {value ? (
                <View className="mt-[-10px] mb-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs text-muted-light dark:text-muted-dark font-medium">
                      Strength: {strength.label}
                    </Text>
                  </View>
                  <View className="flex-row h-1.5 space-x-1">
                    {[1, 2, 3, 4].map((step) => (
                      <View
                        key={step}
                        className="flex-1 rounded-full h-full"
                        style={{
                          backgroundColor:
                            step <= strength.score ? strength.color : '#2A2D45',
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              secureTextEntry
              showPasswordToggle
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          title="Reset Password & Log In"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          size="lg"
          className="mt-2"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
