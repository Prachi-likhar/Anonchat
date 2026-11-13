import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { registerSchema, type RegisterFormValues } from '@/lib/validators';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/store/toastStore';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: 'male',
      agreeToRules: false,
    },
    mode: 'onTouched',
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        gender: values.gender,
      });

      // Save email for verify-email screen fallback
      try {
        sessionStorage.setItem('pending_verify_email', values.email);
      } catch {
        // ignore
      }

      toast.success(
        'Registration successful! Please check your email for your 6-digit verification code.',
        'Code Sent',
      );

      navigate('/verify-email', { state: { email: values.email } });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg, 'Registration Failed');
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-md shadow-primary/20">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Join the Community
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
            Create your account to unlock private one-to-one anonymous chatting.
          </p>
        </div>

        {/* Pseudonym notice badge */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-text">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-primary font-semibold">100% Anonymous Identity:</strong> Your
            permanent anonymous username (e.g.{' '}
            <span className="font-mono font-medium">Anonymous_4821</span>) will be assigned and
            revealed after email verification.
          </p>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div
            className="flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <Input
            label="Full Name (Private)"
            placeholder="e.g. Jane Doe"
            hint="For account verification only. Strictly never shown to any member."
            error={errors.fullName?.message}
            disabled={isSubmitting}
            {...register('fullName')}
          />

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            hint="Used for login and verification codes. Strictly never made public."
            error={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />

          {/* Gender */}
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <SegmentedControl
                label="Gender"
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                options={[
                  { value: 'male', label: 'Male', icon: <span className="font-bold">♂</span> },
                  { value: 'female', label: 'Female', icon: <span className="font-bold">♀</span> },
                ]}
                error={errors.gender?.message}
              />
            )}
          />

          {/* Password */}
          <div className="space-y-1.5">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password')}
            />
            <PasswordStrength password={passwordValue} />
          </div>

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
            {...register('confirmPassword')}
          />

          {/* Community Rules Agreement */}
          <div className="space-y-1 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-text select-none">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                disabled={isSubmitting}
                {...register('agreeToRules')}
              />
              <span className="leading-relaxed">
                I agree to the{' '}
                <span className="font-medium text-primary hover:underline">
                  Community Rules & Privacy Charter
                </span>
                : no harassment, no hate speech, and no unsolicited spam.
              </span>
            </label>
            {errors.agreeToRules && (
              <p className="text-xs text-danger">{errors.agreeToRules.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              rightIcon={<CheckCircle className="h-4 w-4" />}
            >
              Create Account
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-muted border-t border-border pt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};
