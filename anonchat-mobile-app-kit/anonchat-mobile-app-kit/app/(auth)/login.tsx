import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ShieldAlert, AlertTriangle, ShieldX } from 'lucide-react-native';
import { loginSchema, LoginFormData } from '../../src/lib/validators';
import { api } from '../../src/api/client';
import { formatErrorMessage, getErrorCode, getErrorDetails } from '../../src/lib/errors';
import { useAuthStore } from '../../src/store/authStore';
import { Button, TextField, Card } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Suspension & Ban states
  const [suspensionInfo, setSuspensionInfo] = useState<{ until: string; reason: string } | null>(null);
  const [banInfo, setBanInfo] = useState<{ reason: string } | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const { setAuth } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rateLimitSeconds && rateLimitSeconds > 0) {
      timer = setTimeout(() => setRateLimitSeconds((prev) => (prev ? prev - 1 : null)), 1000);
    }
    return () => clearTimeout(timer);
  }, [rateLimitSeconds]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setServerError(null);
    setSuspensionInfo(null);
    setBanInfo(null);

    try {
      const res = await api.post('/auth/login', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      const { user, accessToken, refreshToken } = res.data;
      await setAuth(user, accessToken, refreshToken);
      router.replace('/(app)');
    } catch (err: any) {
      const code = getErrorCode(err);
      const details = getErrorDetails(err);

      if (code === 'EMAIL_NOT_VERIFIED') {
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: data.email.trim().toLowerCase() },
        });
        return;
      }

      if (code === 'ACCOUNT_SUSPENDED') {
        setSuspensionInfo({
          until: (details?.until as string) || 'a future date',
          reason: (details?.reason as string) || 'Violation of community guidelines',
        });
        return;
      }

      if (code === 'ACCOUNT_BANNED') {
        setBanInfo({
          reason: (details?.reason as string) || 'Permanent violation of terms of service',
        });
        return;
      }

      if (err.response?.status === 429) {
        const retryHeader = err.response?.headers?.['retry-after'];
        const secs = retryHeader ? parseInt(retryHeader, 10) : 60;
        setRateLimitSeconds(isNaN(secs) ? 60 : secs);
      }

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
          Welcome Back
        </Text>
        <Text className="text-sm text-muted-light dark:text-muted-dark mb-6">
          Log in with your community email and password.
        </Text>

        {rateLimitSeconds && rateLimitSeconds > 0 && (
          <Card className="bg-amber-500/10 border-amber-500/30 p-3.5 mb-4 flex-row items-center">
            <AlertTriangle size={18} color="#F59E0B" />
            <Text className="text-sm text-amber-500 font-medium ml-2.5 flex-1">
              Too many login attempts. Please wait {rateLimitSeconds}s before retrying.
            </Text>
          </Card>
        )}

        {serverError && !suspensionInfo && !banInfo && (
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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              showPasswordToggle
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <View className="items-end mb-6">
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="text-xs font-semibold text-primary dark:text-primary-light">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title={rateLimitSeconds && rateLimitSeconds > 0 ? `Wait (${rateLimitSeconds}s)` : 'Log In'}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={Boolean(rateLimitSeconds && rateLimitSeconds > 0)}
          size="lg"
        />

        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-sm text-muted-light dark:text-muted-dark">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text className="text-sm font-semibold text-primary dark:text-primary-light">
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Account Suspended Modal */}
      <Modal
        visible={Boolean(suspensionInfo)}
        transparent
        animationType="fade"
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 items-center shadow-2xl">
            <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center mb-4">
              <AlertTriangle size={32} color="#F59E0B" />
            </View>

            <Text className="text-xl font-bold text-content-light dark:text-content-dark text-center mb-2">
              Account Suspended
            </Text>

            <Text className="text-sm text-muted-light dark:text-muted-dark text-center mb-4 leading-relaxed">
              Your account has been temporarily suspended by moderation until:
            </Text>

            <Card className="w-full bg-surface-2-light dark:bg-surface-2-dark p-3.5 mb-4 items-center">
              <Text className="text-sm font-bold text-amber-500">
                {suspensionInfo ? new Date(suspensionInfo.until).toLocaleString() : ''}
              </Text>
              <Text className="text-xs text-muted-light dark:text-muted-dark mt-1 text-center">
                Reason: {suspensionInfo?.reason}
              </Text>
            </Card>

            <Button
              title="Close"
              variant="secondary"
              onPress={() => setSuspensionInfo(null)}
              size="md"
            />
          </View>
        </View>
      </Modal>

      {/* Account Banned Modal */}
      <Modal
        visible={Boolean(banInfo)}
        transparent
        animationType="fade"
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 items-center shadow-2xl">
            <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4">
              <ShieldX size={32} color={tokens.colors.danger} />
            </View>

            <Text className="text-xl font-bold text-content-light dark:text-content-dark text-center mb-2">
              Account Permanently Banned
            </Text>

            <Text className="text-sm text-muted-light dark:text-muted-dark text-center mb-4 leading-relaxed">
              Your account has been permanently banned from Anonchat for severe or repeated violations.
            </Text>

            <Card className="w-full bg-red-500/10 border-red-500/30 p-3.5 mb-6 items-center">
              <Text className="text-xs text-danger font-medium text-center">
                Reason: {banInfo?.reason}
              </Text>
            </Card>

            <Button
              title="Acknowledge"
              variant="danger"
              onPress={() => setBanInfo(null)}
              size="md"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
