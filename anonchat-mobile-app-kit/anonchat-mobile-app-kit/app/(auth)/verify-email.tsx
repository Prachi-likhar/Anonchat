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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { formatErrorMessage } from '../../src/lib/errors';
import { useAuthStore } from '../../src/store/authStore';
import { Button, OtpInput, Card, Avatar } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';
import { Me } from '../../src/types/api';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email] = useState(params.email ? decodeURIComponent(params.email) : '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealedUser, setRevealedUser] = useState<Me | null>(null);

  const { setAuth } = useAuthStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } catch {
        // safe
      }
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/auth/verify-email', {
        email: email.trim().toLowerCase(),
        otp: code,
      });

      const { user, accessToken, refreshToken } = res.data;
      await setAuth(user, accessToken, refreshToken);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {
        // safe
      }

      setRevealedUser(user);
    } catch (err) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } catch {
        // safe
      }
      setErrorMessage(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage(null);
    try {
      await api.post('/auth/resend-otp', {
        email: email.trim().toLowerCase(),
      });
      setCooldown(60);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } catch {
        // safe
      }
    } catch (err) {
      setErrorMessage(formatErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleEnterApp = () => {
    setRevealedUser(null);
    router.replace('/(app)');
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
          Verify Your Email
        </Text>
        <Text className="text-sm text-muted-light dark:text-muted-dark mb-6">
          We sent a 6-digit one-time code to{' '}
          <Text className="font-semibold text-content-light dark:text-content-dark">
            {email || 'your email'}
          </Text>
          .
        </Text>

        {errorMessage && (
          <Card className="bg-red-500/10 border-red-500/30 p-3.5 mb-4 flex-row items-center">
            <ShieldAlert size={18} color={tokens.colors.danger} />
            <Text className="text-sm text-danger font-medium ml-2.5 flex-1">
              {errorMessage}
            </Text>
          </Card>
        )}

        <OtpInput
          value={otp}
          onChange={(newVal) => {
            setOtp(newVal);
            if (newVal.length === 6) {
              handleVerify(newVal);
            }
          }}
          error={Boolean(errorMessage)}
          disabled={loading}
        />

        <View className="my-6">
          <Button
            title="Verify & Continue"
            onPress={() => handleVerify()}
            loading={loading}
            size="lg"
          />
        </View>

        <View className="items-center justify-center mt-2">
          {cooldown > 0 ? (
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              Resend available in{' '}
              <Text className="font-bold text-primary dark:text-primary-light">
                {cooldown}s
              </Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resending}
              className="py-2 px-4 rounded-xl bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark"
            >
              <Text className="text-xs font-semibold text-primary dark:text-primary-light">
                {resending ? 'Sending...' : 'Resend Verification Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Assigned Pseudonym Reveal Modal */}
      <Modal
        visible={Boolean(revealedUser)}
        transparent
        animationType="fade"
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 items-center shadow-2xl">
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
              <Sparkles size={32} color={tokens.colors.primary.DEFAULT} />
            </View>

            <Text className="text-2xl font-bold text-content-light dark:text-content-dark text-center mb-2">
              Welcome to Anonchat!
            </Text>

            <Text className="text-sm text-muted-light dark:text-muted-dark text-center mb-6 leading-relaxed">
              Your real identity has been sealed. You have been assigned your permanent anonymous community handle:
            </Text>

            <View className="w-full bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark rounded-2xl p-4 items-center mb-6">
              <Avatar
                color={revealedUser?.avatarColor}
                anonUsername={revealedUser?.anonUsername}
                size="lg"
                className="mb-3"
              />
              <Text className="text-xl font-bold text-primary dark:text-primary-light">
                {revealedUser?.anonUsername}
              </Text>
              <Text className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">
                Permanent • Never changes
              </Text>
            </View>

            <Button
              title="Enter Anonchat"
              onPress={handleEnterApp}
              size="lg"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
