import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  KeyRound,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { GenderBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AvatarColorPicker } from '@/components/profile/AvatarColorPicker';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { useAuthStore } from '@/store/authStore';
import { meApi } from '@/api/me';
import { authApi } from '@/api/auth';
import { maskEmail } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/store/toastStore';
import {
  profileSchema,
  changePasswordSchema,
  type ProfileFormValues,
  type ChangePasswordFormValues,
} from '@/lib/validators';

export const Profile: React.FC = () => {
  const { user, setUser, clearAuth } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    control: controlProfile,
    watch: watchProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting, isDirty: profileDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      gender: user?.gender || 'male',
      avatarColor: user?.avatarColor || '#7C3AED',
    },
    mode: 'onTouched',
  });

  const selectedColor = watchProfile('avatarColor') || user?.avatarColor || '#7C3AED';

  // Password Change Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    mode: 'onTouched',
  });

  const newPasswordValue = watchPassword('newPassword');

  const onSaveProfile = async (values: ProfileFormValues) => {
    try {
      const updated = await meApi.updateMe({
        fullName: values.fullName,
        gender: values.gender,
        avatarColor: values.avatarColor,
      });

      setUser(updated);
      toast.success('Your profile changes have been saved!', 'Profile Updated');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), 'Update Failed');
    }
  };

  const onChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      await meApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      resetPasswordForm();
      toast.success(
        'Password changed successfully! Other device sessions have been revoked.',
        'Password Updated',
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), 'Password Change Failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await meApi.deleteAccount(deletePassword);
      try {
        await authApi.logout();
      } catch {
        // ignore
      }
      clearAuth();
      toast.info('Your anonymous account and chat data have been deleted.', 'Account Deleted');
      window.location.href = '/';
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUsername = () => {
    if (!user?.anonUsername) return;
    navigator.clipboard.writeText(user.anonUsername);
    setCopied(true);
    toast.success('Anonymous username copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
          <User className="h-4 w-4" />
          <span>Account & Identity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          My Anonymous Profile
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Manage your community persona, avatar color palette, and security preferences.
        </p>
      </div>

      {/* 1. Permanent Anonymous Persona Card */}
      <Card variant="glass" className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <Avatar
          anonUsername={user?.anonUsername}
          avatarColor={selectedColor}
          size="xl"
          showOnlineStatus
          isOnline
        />

        <div className="flex-1 space-y-1.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-bold font-mono text-text">
              {user?.anonUsername || 'Anonymous'}
            </h2>
            <button
              type="button"
              onClick={handleCopyUsername}
              title="Copy username"
              className="rounded-lg p-1 text-muted hover:text-text hover:bg-surface-2 transition-colors focus:outline-none"
            >
              {copied ? <Check className="h-4 w-4 text-online" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2">
            {user?.gender && <GenderBadge gender={user.gender} size="sm" />}
            <span className="text-xs text-muted">
              Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
            </span>
          </div>

          <p className="text-xs text-muted max-w-md pt-1">
            This pseudonym is permanent and assigned at registration to protect your privacy across
            the platform.
          </p>
        </div>
      </Card>

      {/* 2. Profile Customization Form */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <h3 className="text-base font-bold text-text">Identity Settings</h3>
          <p className="text-xs text-muted mt-0.5">
            Customize your avatar swatch and private registration details.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-6">
          {/* Avatar Color Picker */}
          <AvatarColorPicker
            value={selectedColor}
            onChange={(color) => setProfileValue('avatarColor', color, { shouldDirty: true })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <Input
              label="Full Name (Private)"
              hint="Only stored for account verification. Never displayed to members."
              error={profileErrors.fullName?.message}
              disabled={profileSubmitting}
              {...registerProfile('fullName')}
            />

            {/* Read-only masked Email */}
            <Input
              label="Email Address"
              value={maskEmail(user?.email)}
              disabled
              hint="Masked for privacy. Contact support to request email migration."
            />
          </div>

          {/* Gender */}
          <Controller
            name="gender"
            control={controlProfile}
            render={({ field }) => (
              <SegmentedControl
                label="Gender Classification"
                value={field.value || 'male'}
                onChange={(val) => {
                  field.onChange(val);
                }}
                options={[
                  { value: 'male', label: 'Male', icon: <span>♂</span> },
                  { value: 'female', label: 'Female', icon: <span>♀</span> },
                ]}
                error={profileErrors.gender?.message}
              />
            )}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={profileSubmitting}
              disabled={!profileDirty && selectedColor === user?.avatarColor}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Change Password Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="border-b border-border pb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Change Password</h3>
            <p className="text-xs text-muted">
              Updating your password will revoke all other active device sessions.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            error={passwordErrors.currentPassword?.message}
            disabled={passwordSubmitting}
            {...registerPassword('currentPassword')}
          />

          <div className="space-y-1.5">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={passwordErrors.newPassword?.message}
              disabled={passwordSubmitting}
              {...registerPassword('newPassword')}
            />
            <PasswordStrength password={newPasswordValue} />
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={passwordErrors.confirmNewPassword?.message}
            disabled={passwordSubmitting}
            {...registerPassword('confirmNewPassword')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={passwordSubmitting}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Danger Zone Card */}
      <Card className="p-6 sm:p-8 space-y-4 border-danger/30 bg-danger/5">
        <div className="flex items-center gap-2.5 text-danger font-bold text-base">
          <AlertTriangle className="h-5 w-5" />
          <span>Danger Zone</span>
        </div>

        <p className="text-xs text-muted leading-relaxed max-w-xl">
          Permanently delete your account, pseudonym, and all chat history. This action is
          irreversible.
        </p>

        <div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete Account Permanently
          </Button>
        </div>
      </Card>

      {/* Delete Account Password Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletePassword('');
          setDeleteError(null);
        }}
        title="Delete Your Account"
        description="Please confirm by entering your current account password. All active chats and data will be permanently wiped."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          {deleteError && (
            <p className="text-xs text-danger font-medium" role="alert">
              {deleteError}
            </p>
          )}

          <Input
            label="Account Password"
            type="password"
            placeholder="Enter password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            disabled={isDeleting}
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletePassword('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={isDeleting}
              onClick={handleDeleteAccount}
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
