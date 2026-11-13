import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, LogIn, AlertCircle, ShieldAlert, Clock, Ban } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/store/toastStore';
import type { ApiErrorResponse } from '@/types/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [formError, setFormError] = useState<string | null>(null);

  // Suspension modal state
  const [suspensionDetails, setSuspensionDetails] = useState<{
    until?: string;
    reason?: string;
  } | null>(null);

  // Ban banner state
  const [isBanned, setIsBanned] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    setIsBanned(false);
    setSuspensionDetails(null);

    try {
      const res = await authApi.login({
        email: values.email,
        password: values.password,
      });

      setAuth(res.user, res.accessToken);
      toast.success(`Welcome back, ${res.user.anonUsername}!`, 'Logged In');

      // Navigate to redirect target or default /app
      const searchParams = new URLSearchParams(location.search);
      const redirectTarget = searchParams.get('redirect') || '/app';
      navigate(redirectTarget, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as ApiErrorResponse | undefined;
        const code = data?.error?.code;

        // 1. Unverified Email -> redirect to verify
        if (code === 'EMAIL_NOT_VERIFIED') {
          toast.info(
            'Your email address is not yet verified. A fresh OTP code was dispatched.',
            'Verification Required',
          );
          try {
            sessionStorage.setItem('pending_verify_email', values.email);
          } catch {
            // ignore
          }
          navigate('/verify-email', { state: { email: values.email } });
          return;
        }

        // 2. Suspended Account
        if (code === 'ACCOUNT_SUSPENDED') {
          const details = data?.error?.details as { until?: string; reason?: string } | undefined;
          setSuspensionDetails({
            until: details?.until,
            reason: details?.reason || 'Violation of community guidelines',
          });
          return;
        }

        // 3. Banned Account
        if (code === 'ACCOUNT_BANNED') {
          setIsBanned(true);
          return;
        }
      }

      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg, 'Sign In Failed');
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-md shadow-primary/20">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Sign In</h1>
          <p className="text-xs sm:text-sm text-muted">
            Access your anonymous identity and conversations.
          </p>
        </div>

        {/* Ban Alert */}
        {isBanned && (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-xs text-danger space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Ban className="h-4 w-4" />
              <span>Account Permanently Banned</span>
            </div>
            <p className="leading-relaxed">
              This account has been banned due to severe violations of the Community Code of
              Conduct. Access to all anonymous services is revoked.
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {formError && !isBanned && (
          <div
            className="flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-text">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password')}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              rightIcon={<LogIn className="h-4 w-4" />}
            >
              Sign In to App
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-muted border-t border-border pt-4">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register now
          </Link>
        </div>
      </Card>

      {/* Account Suspended Blocking Modal */}
      <Modal
        isOpen={Boolean(suspensionDetails)}
        onClose={() => setSuspensionDetails(null)}
        maxWidth="sm"
        showCloseButton={true}
      >
        <div className="flex flex-col items-center text-center p-2 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-text">Account Suspended</h3>
            <p className="text-xs text-muted mt-1">
              Your account has temporary restrictions applied by community moderators.
            </p>
          </div>

          <div className="w-full rounded-xl bg-surface-2 p-3 text-left space-y-2 text-xs border border-border">
            <div>
              <span className="text-muted block text-[10px] uppercase font-semibold">Reason</span>
              <p className="text-text font-medium mt-0.5">{suspensionDetails?.reason}</p>
            </div>

            {suspensionDetails?.until && (
              <div className="pt-1 border-t border-border/60 flex items-center gap-1.5 text-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Lifted on:{' '}
                  <strong className="text-text">
                    {new Date(suspensionDetails.until).toLocaleString()}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <Button variant="secondary" fullWidth onClick={() => setSuspensionDetails(null)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};
