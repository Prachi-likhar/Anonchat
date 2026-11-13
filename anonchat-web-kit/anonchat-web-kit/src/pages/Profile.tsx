import React from 'react';
import { Card } from '@/components/ui/Card';
import { User, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">My Profile</h1>
          <p className="text-xs text-muted">Manage your identity and avatar (Phase 3)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-text font-mono">Username: {user?.anonUsername}</p>
        <p className="text-xs text-muted mt-2">
          Avatar color customizer, full name updater, and password change coming in Phase 3.
        </p>
      </Card>
    </div>
  );
};

export const Settings: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Settings</h1>
          <p className="text-xs text-muted">Preferences & Blocked Users (Phase 3)</p>
        </div>
      </div>
      <Card>
        <p className="text-sm text-muted">
          Theme preferences, notification sounds, and unblock management coming in Phase 3.
        </p>
      </Card>
    </div>
  );
};
