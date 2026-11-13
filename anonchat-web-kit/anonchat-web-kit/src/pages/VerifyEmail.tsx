import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, RotateCw, AlertCircle, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { GenderBadge } from '@/components/ui/Badge';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';
import type { Me } from '@/types/api';

export const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Welcome modal state after verification
  const [verifiedUser, setVerifiedUser] = useState<Me | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Resolve email from router state or sessionStorage
  useEffect(() => {
    const stateEmail = (location.state as { email?: string } | undefined)?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    } else {
      try {
        const stored = sessionStorage.getItem('pending_verify_email');
        if (stored) {
          setEmail(stored);
        }
      } catch {
        // ignore
      }
    }
  }, [location.state]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle single digit input
  const handleChange = (index: number, value: string) => {
    setError(null);
    // Keep only numbers
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const digit = cleaned.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste support across all boxes
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all 6 digits pasted
    if (pastedData.length === 6 && email) {
      submitVerification(newOtp.join(''));
    }
  };

  const submitVerification = async (code: string) => {
    if (!email) {
      setError('Please provide the email address associated with your registration.');
      return;
    }

    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authApi.verifyEmail({ email, otp: code });
      setAuth(res.user, res.accessToken);
      setVerifiedUser(res.user);
      setShowWelcomeModal(true);

      // Clean up sessionStorage
      try {
        sessionStorage.removeItem('pending_verify_email');
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(msg, 'Verification Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !email) return;
    setIsResending(true);
    setError(null);

    try {
      await authApi.resendOtp(email);
      setResendCooldown(60);
      toast.success('A new 6-digit verification code has been sent.', 'Code Sent');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), 'Resend Failed');
    } finally {
      setIsResending(false);
    }
  };

  const handleModalProceed = () => {
    setShowWelcomeModal(false);
    navigate('/app');
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Verify Your Email</h1>
          <p className="text-xs sm:text-sm text-muted">
            Enter the 6-digit code sent to{' '}
            <span className="font-semibold text-text">{email || 'your email'}</span>
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-box OTP input */}
        <div className="space-y-4">
          <div
            className={cn(
              'flex justify-center gap-2 sm:gap-2.5',
              shake && 'animate-shake transition-transform',
            )}
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={isSubmitting}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  'h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold font-mono rounded-xl border border-border bg-surface text-text shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                  digit && 'border-primary/60 bg-primary/5',
                  error && 'border-danger focus:border-danger focus:ring-danger/20',
                )}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            onClick={() => submitVerification(otp.join(''))}
            disabled={otp.join('').length !== 6 || isSubmitting}
          >
            Verify & Unlock Pseudonym
          </Button>
        </div>

        {/* Resend Cooldown */}
        <div className="flex flex-col items-center justify-center gap-2 pt-2 text-center text-xs">
          <p className="text-muted">Didn't receive the code?</p>
          <button
            type="button"
            disabled={resendCooldown > 0 || isResending}
            onClick={handleResend}
            className={cn(
              'inline-flex items-center gap-1.5 font-semibold text-primary transition-colors focus:outline-none',
              (resendCooldown > 0 || isResending) && 'cursor-not-allowed text-muted font-normal',
            )}
          >
            <RotateCw className={cn('h-3.5 w-3.5', isResending && 'animate-spin')} />
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code now'}
          </button>
        </div>

        {/* Back Link */}
        <div className="border-t border-border pt-4 text-center text-xs text-muted">
          Need to change email?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register again
          </Link>
        </div>
      </Card>

      {/* Welcome & Anonymous Identity Reveal Modal */}
      <Modal
        isOpen={showWelcomeModal}
        onClose={handleModalProceed}
        maxWidth="md"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center text-center p-2 space-y-5">
          {/* Sparkles icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-lg shadow-primary/20">
            <Sparkles className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text">Identity Verified!</h2>
            <p className="text-xs text-muted mt-1">
              Your real identity has been sealed. Here is your official community persona:
            </p>
          </div>

          {/* Identity Card */}
          <div className="w-full rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col items-center gap-3">
            <Avatar
              anonUsername={verifiedUser?.anonUsername}
              avatarColor={verifiedUser?.avatarColor}
              size="xl"
              showOnlineStatus
              isOnline
            />

            <div className="text-center">
              <h3 className="text-xl font-bold font-mono tracking-wide text-text">
                {verifiedUser?.anonUsername}
              </h3>
              <div className="mt-1 flex items-center justify-center gap-2">
                {verifiedUser?.gender && <GenderBadge gender={verifiedUser.gender} size="sm" />}
                <span className="text-[11px] text-online font-medium flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-online animate-pulse" />
                  Active Persona
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Tips */}
          <div className="w-full text-left space-y-2 rounded-xl bg-surface-2 p-3.5 text-xs text-muted border border-border">
            <div className="flex items-center gap-1.5 font-semibold text-text">
              <Shield className="h-4 w-4 text-primary" />
              <span>Core Privacy Guidelines:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Members will only ever see your anonymous pseudonym and avatar.</li>
              <li>Never disclose your real name, email, or social accounts in chat.</li>
              <li>You can block or report disruptive members at any time.</li>
            </ul>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleModalProceed}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Enter Chat Dashboard
          </Button>
        </div>
      </Modal>
    </div>
  );
};
