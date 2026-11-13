import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validators';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/store/toastStore';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const initialEmail = (location.state as { email?: string } | undefined)?.email || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (initialEmail) {
      setValue('email', initialEmail);
    }
  }, [initialEmail, setValue]);

  const passwordValue = watch('newPassword');

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setFormError(null);
    try {
      await authApi.resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      });

      toast.success(
        'Password reset successfully! You can now sign in with your new credentials.',
        'Password Reset',
      );
      navigate('/login');
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg, 'Password Reset Failed');
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-md shadow-primary/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Choose New Password</h1>
          <p className="text-xs sm:text-sm text-muted">
            Enter the 6-digit reset code from your email and your new password.
          </p>
        </div>

        {formError && (
          <div
            className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />

          <Input
            label="6-Digit Reset Code"
            type="text"
            placeholder="123456"
            maxLength={6}
            error={errors.otp?.message}
            disabled={isSubmitting}
            {...register('otp')}
          />

          <div className="space-y-1.5">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.newPassword?.message}
              disabled={isSubmitting}
              {...register('newPassword')}
            />
            <PasswordStrength password={passwordValue} />
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
            {...register('confirmPassword')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              rightIcon={<CheckCircle className="h-4 w-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>

        <div className="border-t border-border pt-4 text-center text-xs text-muted">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};
