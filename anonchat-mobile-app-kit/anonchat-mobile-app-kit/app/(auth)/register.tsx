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
import { CheckSquare, Square, ArrowLeft } from 'lucide-react-native';
import { registerSchema, RegisterFormData } from '../../src/lib/validators';
import { evaluatePasswordStrength } from '../../src/lib/passwordStrength';
import { api } from '../../src/api/client';
import { formatErrorMessage } from '../../src/lib/errors';
import { Button, TextField, SegmentedControl, Card } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: 'male',
      agreeToRules: false,
    },
  });

  const passwordValue = watch('password');
  const strength = evaluatePasswordStrength(passwordValue || '');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setServerError(null);
    try {
      await api.post('/auth/register', {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        gender: data.gender,
      });

      router.push({
        pathname: '/(auth)/verify-email',
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
          Create Anonymous Account
        </Text>
        <Text className="text-sm text-muted-light dark:text-muted-dark mb-6">
          Chat freely without ever exposing your real identity.
        </Text>

        {serverError && (
          <Card className="bg-red-500/10 border-red-500/30 p-3.5 mb-4">
            <Text className="text-sm text-danger font-medium">{serverError}</Text>
          </Card>
        )}

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Full Name (Private Verification)"
              placeholder="e.g. Jane Doe"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.fullName?.message}
              helperText="Strictly private — only used for community verification, never exposed."
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Community Email"
              placeholder="name@university.edu"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
              helperText="We send a 6-digit one-time code to verify membership."
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium mb-1.5 text-content-light dark:text-content-dark">
            Gender Category
          </Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <SegmentedControl
                options={[
                  { label: '♂ Male', value: 'male' },
                  { label: '♀ Female', value: 'female' },
                ]}
                value={value}
                onChange={onChange}
              />
            )}
          />
          {errors.gender?.message && (
            <Text className="text-xs text-danger mt-1">{errors.gender.message}</Text>
          )}
        </View>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <TextField
                label="Password"
                placeholder="At least 8 chars (1 letter + 1 number)"
                secureTextEntry
                showPasswordToggle
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
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
              label="Confirm Password"
              placeholder="Re-enter your password"
              secureTextEntry
              showPasswordToggle
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="agreeToRules"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity
              onPress={() => onChange(!value)}
              activeOpacity={0.8}
              className="flex-row items-start mb-6 mt-1"
            >
              <View className="mr-3 mt-0.5">
                {value ? (
                  <CheckSquare size={20} color={tokens.colors.primary.DEFAULT} />
                ) : (
                  <Square size={20} color={tokens.colors.muted.dark} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xs text-content-light dark:text-content-dark leading-relaxed">
                  I agree to the Community Privacy Rules and understand that my real identity will never be visible to other members.
                </Text>
                {errors.agreeToRules?.message && (
                  <Text className="text-xs text-danger mt-1 font-medium">
                    {errors.agreeToRules.message}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />

        <Button
          title="Create Account"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          size="lg"
        />

        <View className="flex-row items-center justify-center mt-6 mb-8">
          <Text className="text-sm text-muted-light dark:text-muted-dark">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-sm font-semibold text-primary dark:text-primary-light">
              Log in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
