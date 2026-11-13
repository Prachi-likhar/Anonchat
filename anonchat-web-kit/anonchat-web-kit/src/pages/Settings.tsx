import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  ShieldBan,
  LogOut,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { GenderBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { blocksApi } from '@/api/blocks';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/errors';

export const Settings: React.FC = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Notification preferences in localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('anonchat_sound') !== 'false';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('anonchat_notifications') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('anonchat_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('anonchat_notifications', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled && typeof Notification !== 'undefined') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          toast.success('Browser notifications enabled.');
        } else {
          toast.warning('Notification permission was denied in your browser settings.');
        }
      } catch {
        // ignore
      }
    } else {
      setNotificationsEnabled(!notificationsEnabled);
    }
  };

  // Fetch Blocked Users List
  const { data: blockedData, isLoading: blockedLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => blocksApi.getBlockedUsers(),
  });

  const unblockMutation = useMutation({
    mutationFn: (memberId: string) => blocksApi.unblockUser(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('Member unblocked successfully.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err), 'Unblock Failed');
    },
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const blockedUsers = blockedData?.items || [];

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
          <SettingsIcon className="h-4 w-4" />
          <span>Application Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Preferences</h1>
        <p className="text-xs sm:text-sm text-muted">
          Manage appearance themes, notification sounds, and blocked contacts.
        </p>
      </div>

      {/* 1. Appearance / Theme */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Interface Theme</h3>
              <p className="text-xs text-muted">
                Choose between dark, light, or auto-sync with system OS.
              </p>
            </div>
          </div>

          <ThemeToggle showLabels />
        </div>
      </Card>

      {/* 2. Notification Preferences */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Notification Preferences</h3>
            <p className="text-xs text-muted">
              Configure message alerts, sound effects, and desktop notifications.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-medium text-text text-sm">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted" />
                )}
                <span>Chat Message Sounds</span>
              </div>
              <p className="text-muted">Play a subtle chime when receiving new incoming messages.</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                soundEnabled ? 'bg-primary' : 'bg-surface-2 border border-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Browser Desktop Notifications */}
          <div className="flex items-center justify-between py-1 border-t border-border/60 pt-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-medium text-text text-sm">
                <Bell className="h-4 w-4 text-primary" />
                <span>Browser Push Notifications</span>
              </div>
              <p className="text-muted">
                Display private popups when new messages arrive while this tab is inactive.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                notificationsEnabled ? 'bg-primary' : 'bg-surface-2 border border-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Blocked Users List */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <ShieldBan className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Blocked Community Members</h3>
              <p className="text-xs text-muted">
                Blocked members cannot view your presence or send you direct messages.
              </p>
            </div>
          </div>
        </div>

        {blockedLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-2">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" className="h-8 w-8" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
        ) : blockedUsers.length === 0 ? (
          <EmptyState
            icon={<ShieldBan className="h-5 w-5 text-muted" />}
            title="No blocked members"
            description="You have not blocked any members. Blocked users will appear here."
          />
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    anonUsername={member.anonUsername}
                    avatarColor={member.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-xs text-text truncate">
                      {member.anonUsername}
                    </p>
                    <GenderBadge gender={member.gender} size="sm" className="mt-0.5" />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={unblockMutation.isPending}
                  onClick={() => unblockMutation.mutate(member.id)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4. Session & Security Links */}
      <Card className="p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-text">Session Management</h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-muted space-y-1">
            <p>Active session is authenticated with an in-memory token.</p>
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1 text-primary hover:underline cursor-pointer">
                Community Rules <ExternalLink className="h-3 w-3" />
              </span>
              <span className="flex items-center gap-1 text-primary hover:underline cursor-pointer">
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>

          <Button
            variant="danger"
            size="md"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Log Out Now
          </Button>
        </div>
      </Card>
    </div>
  );
};
