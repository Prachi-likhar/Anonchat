import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../src/lib/validators';
import { api } from '../../src/api/client';
import { formatErrorMessage } from '../../src/lib/errors';
import { Button, TextField, Card } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setServerError(null);
    try {
      await api.post('/auth/forgot-password', {
        email: data.email.trim().toLowerCase(),
      });

      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: data.email.trim().toLowerCase() },
      });
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
          Recover Password
        </Text>
        <Text className="text-sm text-muted-light dark:text-muted-dark mb-6">
          Enter your registered email. We will send you a 6-digit recovery code.
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
              placeholder="name@university.edu"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />

        <Button
          title="Send Recovery Code"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          size="lg"
          className="mt-2"
        />

        <View className="items-center mt-6">
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-sm font-semibold text-primary dark:text-primary-light">
              Back to Log In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
